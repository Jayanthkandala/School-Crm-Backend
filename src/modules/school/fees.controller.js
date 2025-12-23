const { getTenantPrismaClient } = require('../../utils/tenantDb');

// Fee Structures
const getAllFeeStructures = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const feeStructures = await tenantDb.feeStructure.findMany({
            include: {
                class: {
                    select: {
                        className: true,
                        section: true,
                    },
                },
                _count: {
                    select: {
                        invoices: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { feeStructures } });
    } catch (error) {
        console.error('getAllFeeStructures error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch fee structures' });
    }
};

const createFeeStructure = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, academicYear, tuitionFee, admissionFee, examFee, libraryFee, sportsFee, otherFees, dueDate } = req.body;

        const total = (tuitionFee || 0) + (admissionFee || 0) + (examFee || 0) +
            (libraryFee || 0) + (sportsFee || 0) + (otherFees || 0);

        const feeStructure = await tenantDb.feeStructure.create({
            data: {
                classId,
                academicYear,
                tuitionFee: tuitionFee || 0,
                admissionFee: admissionFee || 0,
                examFee: examFee || 0,
                libraryFee: libraryFee || 0,
                sportsFee: sportsFee || 0,
                otherFees: otherFees || 0,
                total,
                dueDate: dueDate ? new Date(dueDate) : new Date(),
            },
            include: {
                class: true,
            },
        });

        res.status(201).json({ success: true, data: { feeStructure } });
    } catch (error) {
        console.error('createFeeStructure error:', error);
        res.status(500).json({ success: false, message: 'Failed to create fee structure' });
    }
};

// Invoice Management
const generateInvoices = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, academicYear, month } = req.body;

        // Get fee structure for the class
        const feeStructure = await tenantDb.feeStructure.findFirst({
            where: { classId, academicYear },
        });

        if (!feeStructure) {
            return res.status(404).json({
                success: false,
                message: 'Fee structure not found for this class'
            });
        }

        // Get all students in the class
        const students = await tenantDb.student.findMany({
            where: { classId, status: 'ACTIVE' },
        });

        const invoices = [];
        for (const student of students) {
            // Check if invoice already exists
            const existing = await tenantDb.feeInvoice.findFirst({
                where: {
                    studentId: student.id,
                    feeStructureId: feeStructure.id,
                    month,
                },
            });

            if (!existing) {
                const invoice = await tenantDb.feeInvoice.create({
                    data: {
                        studentId: student.id,
                        feeStructureId: feeStructure.id,
                        month,
                        total: feeStructure.total,
                        paid: 0,
                        balance: feeStructure.total,
                        status: 'PENDING',
                        dueDate: feeStructure.dueDate,
                    },
                });
                invoices.push(invoice);
            }
        }

        res.status(201).json({
            success: true,
            data: {
                invoices,
                count: invoices.length,
                message: `Generated ${invoices.length} invoices for ${students.length} students`
            }
        });
    } catch (error) {
        console.error('generateInvoices error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate invoices' });
    }
};

const getAllInvoices = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { status, classId } = req.query;

        const where = {};
        if (status) where.status = status;
        if (classId) where.student = { classId };

        const invoices = await tenantDb.feeInvoice.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true } },
                        class: { select: { className: true, section: true } }
                    }
                },
                feeStructure: true,
                payments: true
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: { invoices } });
    } catch (error) {
        console.error('getAllInvoices error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
};

const getStudentInvoices = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const invoices = await tenantDb.feeInvoice.findMany({
            where: { studentId },
            include: {
                feeStructure: {
                    include: {
                        class: true,
                    },
                },
                payments: {
                    orderBy: { paymentDate: 'desc' },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { invoices } });
    } catch (error) {
        console.error('getStudentInvoices error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student invoices' });
    }
};

// Payment Management
const recordPayment = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { invoiceId, amount, paymentMethod, transactionId, remarks } = req.body;

        // Get invoice
        const invoice = await tenantDb.feeInvoice.findUnique({
            where: { id: invoiceId },
        });

        if (!invoice) {
            return res.status(404).json({ success: false, message: 'Invoice not found' });
        }

        if (amount > invoice.balance) {
            return res.status(400).json({
                success: false,
                message: `Payment amount (${amount}) exceeds balance (${invoice.balance})`
            });
        }

        // Use Transaction to update both tables
        const payment = await tenantDb.$transaction(async (tx) => {
            // Create payment record
            const newPayment = await tx.feePayment.create({
                data: {
                    invoiceId,
                    amount,
                    paymentMethod: paymentMethod || 'CASH',
                    transactionId,
                    remarks,
                    paymentDate: new Date(),
                },
            });

            // Update invoice
            const newPaid = Number(invoice.paid) + Number(amount);
            const newBalance = Number(invoice.total) - newPaid;
            const newStatus = newBalance === 0 ? 'PAID' : newBalance < invoice.total ? 'PARTIAL' : 'PENDING';

            await tx.feeInvoice.update({
                where: { id: invoiceId },
                data: {
                    paid: newPaid,
                    balance: newBalance,
                    status: newStatus,
                },
            });

            return newPayment;
        });

        // Calculate for response (using calculated values for display)
        const newPaid = Number(invoice.paid) + Number(amount);
        const newBalance = Number(invoice.total) - newPaid;

        res.status(201).json({
            success: true,
            data: { payment },
            message: `Payment of ${amount} recorded successfully. Balance: ${newBalance}`
        });
    } catch (error) {
        console.error('recordPayment error:', error);
        res.status(500).json({ success: false, message: 'Failed to record payment' });
    }
};

const processOnlinePayment = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { invoiceId, amount, razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body;

        // Verify Razorpay signature for security
        const crypto = require('crypto');
        const razorpaySecret = process.env.RAZORPAY_KEY_SECRET;

        if (!razorpaySecret) {
            console.error('RAZORPAY_KEY_SECRET not configured');
            return res.status(500).json({
                success: false,
                message: 'Payment gateway not configured properly'
            });
        }

        // Generate expected signature
        const generatedSignature = crypto
            .createHmac('sha256', razorpaySecret)
            .update(`${razorpayOrderId}|${razorpayPaymentId}`)
            .digest('hex');

        // Verify signature
        if (generatedSignature !== razorpaySignature) {
            console.error('Razorpay signature verification failed');
            return res.status(400).json({
                success: false,
                message: 'Invalid payment signature. Payment verification failed.'
            });
        }

        // Record payment
        const payment = await tenantDb.feePayment.create({
            data: {
                invoiceId,
                amount,
                paymentMethod: 'ONLINE',
                transactionId: razorpayPaymentId,
                razorpayOrderId,
                razorpayPaymentId,
                status: 'SUCCESS',
                paymentDate: new Date(),
            },
        });

        // Update invoice
        const invoice = await tenantDb.feeInvoice.findUnique({ where: { id: invoiceId } });
        const newPaid = invoice.paid + amount;
        const newBalance = invoice.total - newPaid;

        await tenantDb.feeInvoice.update({
            where: { id: invoiceId },
            data: {
                paid: newPaid,
                balance: newBalance,
                status: newBalance === 0 ? 'PAID' : 'PARTIAL',
            },
        });

        res.status(201).json({ success: true, data: { payment } });
    } catch (error) {
        console.error('processOnlinePayment error:', error);
        res.status(500).json({ success: false, message: 'Failed to process online payment' });
    }
};

// Reports
const getFeeDefaulters = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const defaulters = await tenantDb.feeInvoice.findMany({
            where: {
                status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
                dueDate: { lt: new Date() },
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                phone: true,
                                email: true,
                            },
                        },
                        class: {
                            select: {
                                className: true,
                                section: true,
                            },
                        },
                    },
                },
                feeStructure: true,
            },
            orderBy: { dueDate: 'asc' },
        });

        res.json({ success: true, data: { defaulters, count: defaulters.length } });
    } catch (error) {
        console.error('getFeeDefaulters error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch defaulters' });
    }
};

const sendPaymentReminders = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const defaulters = await tenantDb.feeInvoice.findMany({
            where: {
                status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] },
            },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        // Send email reminders to defaulters
        const { sendEmail } = require('../../services/email.service');
        let emailsSent = 0;

        for (const invoice of defaulters) {
            try {
                // Get parent email
                const parent = await tenantDb.parent.findFirst({
                    where: { students: { some: { id: invoice.studentId } } },
                    include: { user: true }
                });

                if (parent?.user?.email) {
                    await sendEmail({
                        to: parent.user.email,
                        subject: 'Fee Payment Reminder',
                        template: 'feeReminderEmail',
                        data: {
                            parentName: parent.user.fullName,
                            studentName: invoice.student.user.fullName,
                            amount: invoice.balance,
                            dueDate: invoice.dueDate,
                            invoiceNumber: invoice.invoiceNumber,
                            paymentUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/parent/fees`
                        }
                    });
                    emailsSent++;
                }
            } catch (emailError) {
                console.error(`Failed to send reminder to ${invoice.student.user.email}:`, emailError);
            }
        }

        console.log(`Sent ${emailsSent} fee reminder emails`);

        res.json({
            success: true,
            message: `Reminders sent to ${defaulters.length} students`,
            data: { count: defaulters.length }
        });
    } catch (error) {
        console.error('sendPaymentReminders error:', error);
        res.status(500).json({ success: false, message: 'Failed to send reminders' });
    }
};

const getCollectionReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate && endDate) {
            where.paymentDate = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const payments = await tenantDb.feePayment.findMany({
            where,
            include: {
                invoice: {
                    include: {
                        student: {
                            include: {
                                user: { select: { fullName: true } },
                                class: { select: { className: true, section: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { paymentDate: 'desc' },
        });

        const totalCollected = payments.reduce((sum, payment) => sum + payment.amount, 0);
        const byMethod = payments.reduce((acc, payment) => {
            acc[payment.paymentMethod] = (acc[payment.paymentMethod] || 0) + payment.amount;
            return acc;
        }, {});

        res.json({
            success: true,
            data: {
                payments,
                totalCollected,
                byMethod,
                count: payments.length
            }
        });
    } catch (error) {
        console.error('getCollectionReport error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch collection report' });
    }
};

const generateReceipt = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const payment = await tenantDb.feePayment.findUnique({
            where: { id: paymentId },
            include: {
                invoice: {
                    include: {
                        student: {
                            include: {
                                user: true,
                                class: true,
                            },
                        },
                        feeStructure: true,
                    },
                },
            },
        });

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Get school settings
        const settings = await tenantDb.settings.findFirst({
            orderBy: { createdAt: 'desc' }
        });

        const schoolInfo = settings?.schoolInfo || {};

        // Generate PDF receipt
        const { generateFeeReceiptPDF } = require('../../utils/pdfGenerator');
        const { filepath, filename } = await generateFeeReceiptPDF({
            receiptNumber: payment.id.substring(0, 8).toUpperCase(),
            schoolName: schoolInfo.schoolName || 'School Name',
            schoolAddress: schoolInfo.address || '',
            studentName: payment.invoice.student.user.fullName,
            admissionNumber: payment.invoice.student.admissionNumber,
            className: `${payment.invoice.student.class.className} - ${payment.invoice.student.class.section}`,
            amount: payment.amount,
            paymentDate: payment.paymentDate,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId
        });

        res.json({
            success: true,
            data: {
                payment,
                pdfUrl: `/uploads/receipts/${filename}`,
                pdfPath: filepath
            },
            message: 'Receipt generated successfully'
        });
    } catch (error) {
        console.error('generateReceipt error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate receipt' });
    }
};

module.exports = {
    getAllFeeStructures,
    createFeeStructure,
    generateInvoices,
    getAllInvoices, // Added
    getStudentInvoices,
    recordPayment,
    processOnlinePayment,
    getFeeDefaulters,
    sendPaymentReminders,
    getCollectionReport,
    generateReceipt,
};
