const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Generate monthly invoices for all active schools
 * This should be run as a cron job on 1st of every month
 */
const generateMonthlyInvoices = async (req, res) => {
    try {
        const schools = await prisma.school.findMany({
            where: { status: 'ACTIVE' },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });

        let generated = 0;
        let failed = 0;
        const errors = [];

        for (const school of schools) {
            try {
                const { subscription } = school;

                if (!subscription || subscription.status === 'CANCELLED') {
                    continue;
                }

                const { plan } = subscription;
                const amount = Number(plan.priceMonthly);
                const gst = amount * 0.18; // 18% GST for India
                const total = amount + gst;

                // Generate invoice number
                const count = await prisma.invoice.count();
                const invoiceNumber = `INV/${new Date().getFullYear()}/${(count + 1).toString().padStart(6, '0')}`;

                // Create invoice
                await prisma.invoice.create({
                    data: {
                        schoolId: school.id,
                        invoiceNumber,
                        amount,
                        gst,
                        total,
                        status: 'PENDING',
                        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
                        billingPeriod: `${new Date().getFullYear()}-${(new Date().getMonth() + 1).toString().padStart(2, '0')}`,
                    },
                });

                // TODO: Send invoice email
                // await sendInvoiceEmail(school.contactEmail, invoice);

                generated++;
            } catch (error) {
                console.error(`Failed to generate invoice for school ${school.id}:`, error);
                failed++;
                errors.push({
                    schoolId: school.id,
                    schoolName: school.schoolName,
                    error: error.message,
                });
            }
        }

        res.json({
            success: true,
            message: 'Monthly invoices generated',
            data: {
                generated,
                failed,
                errors,
            },
        });
    } catch (error) {
        console.error('Generate invoices error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate invoices',
        });
    }
};

/**
 * Process payment for an invoice
 */
const processInvoicePayment = async (req, res) => {
    try {
        const { invoiceId } = req.params;
        const { paymentMethod, transactionId, amount } = req.body;

        const invoice = await prisma.invoice.findUnique({
            where: { id: invoiceId },
            include: { school: true },
        });

        if (!invoice) {
            return res.status(404).json({
                success: false,
                message: 'Invoice not found',
            });
        }

        // Update invoice
        await prisma.invoice.update({
            where: { id: invoiceId },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                paymentMethod,
                transactionId,
            },
        });

        // Extend subscription
        const subscription = await prisma.subscription.findFirst({
            where: { schoolId: invoice.schoolId },
        });

        if (subscription) {
            const newEndDate = new Date(subscription.endDate);
            newEndDate.setMonth(newEndDate.getMonth() + 1);

            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    endDate: newEndDate,
                    status: 'ACTIVE',
                },
            });
        }

        // TODO: Send payment confirmation email

        res.json({
            success: true,
            message: 'Payment processed successfully',
            data: {
                invoice: {
                    id: invoice.id,
                    invoiceNumber: invoice.invoiceNumber,
                    amount: invoice.total,
                    status: 'PAID',
                },
            },
        });
    } catch (error) {
        console.error('Process payment error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process payment',
        });
    }
};

/**
 * Handle failed payments and send reminders
 */
const handleFailedPayments = async (req, res) => {
    try {
        const overdueInvoices = await prisma.invoice.findMany({
            where: {
                status: 'PENDING',
                dueDate: {
                    lt: new Date(),
                },
            },
            include: {
                school: {
                    include: {
                        subscription: true,
                    },
                },
            },
        });

        let reminders = 0;
        let suspended = 0;

        for (const invoice of overdueInvoices) {
            const daysOverdue = Math.floor(
                (new Date() - new Date(invoice.dueDate)) / (1000 * 60 * 60 * 24)
            );

            if (daysOverdue === 1 || daysOverdue === 7 || daysOverdue === 14) {
                // Send reminder email
                // TODO: await sendPaymentReminderEmail(invoice.school.contactEmail, invoice);
                reminders++;
            }

            if (daysOverdue >= 30) {
                // Suspend school after 30 days
                await prisma.school.update({
                    where: { id: invoice.schoolId },
                    data: {
                        status: 'SUSPENDED',
                        suspendedAt: new Date(),
                        suspensionReason: 'Non-payment',
                    },
                });

                await prisma.subscription.update({
                    where: { id: invoice.school.subscription.id },
                    data: { status: 'SUSPENDED' },
                });

                suspended++;
            }
        }

        res.json({
            success: true,
            message: 'Failed payments processed',
            data: {
                overdueInvoices: overdueInvoices.length,
                remindersSent: reminders,
                schoolsSuspended: suspended,
            },
        });
    } catch (error) {
        console.error('Handle failed payments error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to handle failed payments',
        });
    }
};

/**
 * Upgrade/downgrade subscription
 */
const changeSubscriptionPlan = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { newPlanId } = req.body;

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });

        const newPlan = await prisma.subscriptionPlan.findUnique({
            where: { id: newPlanId },
        });

        const oldPlan = school.subscription.plan;

        // Calculate prorated amount
        const daysRemaining = Math.floor(
            (new Date(school.subscription.endDate) - new Date()) / (1000 * 60 * 60 * 24)
        );
        const daysInMonth = 30;
        const proratedOldAmount = (Number(oldPlan.priceMonthly) / daysInMonth) * daysRemaining;
        const proratedNewAmount = (Number(newPlan.priceMonthly) / daysInMonth) * daysRemaining;
        const difference = proratedNewAmount - proratedOldAmount;

        // Update subscription
        await prisma.subscription.update({
            where: { id: school.subscription.id },
            data: {
                planId: newPlanId,
            },
        });

        // If upgrade, create prorated invoice
        if (difference > 0) {
            const count = await prisma.invoice.count();
            const invoiceNumber = `INV/${new Date().getFullYear()}/${(count + 1).toString().padStart(6, '0')}`;

            await prisma.invoice.create({
                data: {
                    schoolId,
                    invoiceNumber,
                    amount: difference,
                    gst: difference * 0.18,
                    total: difference * 1.18,
                    status: 'PENDING',
                    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    billingPeriod: 'Prorated Upgrade',
                },
            });
        }

        res.json({
            success: true,
            message: 'Subscription plan changed successfully',
            data: {
                oldPlan: oldPlan.planName,
                newPlan: newPlan.planName,
                proratedAmount: Math.round(difference * 100) / 100,
            },
        });
    } catch (error) {
        console.error('Change plan error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change subscription plan',
        });
    }
};

/**
 * Cancel subscription
 */
const cancelSubscription = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { reason, cancelImmediately } = req.body;

        const subscription = await prisma.subscription.findFirst({
            where: { schoolId },
        });

        if (cancelImmediately) {
            // Cancel immediately
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancellationReason: reason,
                },
            });

            await prisma.school.update({
                where: { id: schoolId },
                data: { status: 'CANCELLED' },
            });
        } else {
            // Cancel at end of billing period
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: {
                    autoRenew: false,
                    cancellationReason: reason,
                },
            });
        }

        res.json({
            success: true,
            message: cancelImmediately
                ? 'Subscription cancelled immediately'
                : 'Subscription will be cancelled at end of billing period',
        });
    } catch (error) {
        console.error('Cancel subscription error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to cancel subscription',
        });
    }
};

/**
 * Manually create an invoice
 */
const createInvoice = async (req, res) => {
    try {
        const { schoolId, amount, tax, description, dueDate } = req.body;

        const school = await prisma.school.findUnique({
            where: { id: schoolId }
        });

        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        const count = await prisma.invoice.count();
        const invoiceNumber = `INV/${new Date().getFullYear()}/${(count + 1).toString().padStart(6, '0')}`;

        const gst = tax || 0;
        const total = Number(amount) + Number(gst);

        const invoice = await prisma.invoice.create({
            data: {
                schoolId,
                invoiceNumber,
                amount: Number(amount),
                tax: Number(gst),
                total: Number(total),
                status: 'SENT', // Manual invoices are assumed sent
                dueDate: new Date(dueDate),
                description,
                billingPeriod: 'Manual Invoice',
            },
        });

        res.status(201).json({
            success: true,
            message: 'Invoice created successfully',
            data: { invoice },
        });
    } catch (error) {
        console.error('Create invoice error:', error);
        res.status(500).json({ success: false, message: 'Failed to create invoice' });
    }
};

/**
 * Get invoice by ID
 */
const getInvoiceById = async (req, res) => {
    try {
        const { id } = req.params;

        const invoice = await prisma.invoice.findUnique({
            where: { id },
            include: {
                school: {
                    select: {
                        id: true,
                        schoolName: true,
                        adminName: true,
                        adminEmail: true,
                        address: true,
                    }
                }
            }
        });

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        res.json({
            success: true,
            data: { invoice },
        });
    } catch (error) {
        console.error('Get invoice error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch invoice' });
    }
};

/**
 * Get all invoices (with filtering)
 */
const getAllInvoices = async (req, res) => {
    try {
        const { status, page = 1, limit = 50, search } = req.query;

        const where = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { invoiceNumber: { contains: search, mode: 'insensitive' } },
                { school: { schoolName: { contains: search, mode: 'insensitive' } } }
            ];
        }

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                include: {
                    school: {
                        select: {
                            id: true,
                            schoolName: true,
                            subdomain: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.invoice.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                invoices,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
};

module.exports = {
    generateMonthlyInvoices,
    processInvoicePayment,
    handleFailedPayments,
    changeSubscriptionPlan,
    cancelSubscription,
    createInvoice,
    getInvoiceById,
    getAllInvoices,
};
