const { PrismaClient } = require('.prisma/client-platform');
const { hashPassword } = require('../../utils/encryption.util');
const { generateRandomToken } = require('../../utils/encryption.util');

const { sendEmail } = require('../../services/email.service');
const { getTenantPrismaClient, ensureTenantSchema } = require('../../utils/tenantDb');

const prisma = new PrismaClient();

/**
 * Create new school
 */
const createSchool = async (req, res) => {
    try {
        const {
            schoolName,
            subdomain,
            adminName,
            adminEmail,
            adminPhone,
            adminPassword,
            subscriptionPlanId, // Assuming ID is sent
            address,
            city,
            state,
            country = 'India',
            pinCode,
        } = req.body;

        console.log('📝 Create School Request:', JSON.stringify(req.body, null, 2));

        // Validate required fields
        if (!schoolName || !subdomain || !adminName || !adminEmail || !subscriptionPlanId) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: School Name, Tenant ID, Admin Name, Admin Email, and Subscription Plan are required.',
            });
        }

        // Check if subdomain is taken
        const existingSchool = await prisma.school.findUnique({
            where: { subdomain: subdomain.toLowerCase() },
        });

        if (existingSchool) {
            return res.status(409).json({
                success: false,
                message: 'Tenant ID (Subdomain) is already taken. Please choose another one.',
            });
        }

        // Find subscription plan (handle if ID or Code is sent)
        let plan = await prisma.subscriptionPlan.findFirst({
            where: {
                OR: [
                    { id: subscriptionPlanId },
                    { planCode: subscriptionPlanId }
                ]
            }
        });

        if (!plan) {
            // Fallback: Get default/first plan if not found (strictly for safety, or error out)
            console.warn(`Plan '${subscriptionPlanId}' not found. Using default/first available plan.`);
            plan = await prisma.subscriptionPlan.findFirst();
            if (!plan) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid Subscription Plan. Please contact support.',
                });
            }
        }

        const tempPassword = adminPassword || generateRandomToken(10);

        // Create School in Platform DB
        // We create it first to get the auto-increment sequenceId
        let school = await prisma.school.create({
            data: {
                schoolName,
                subdomain: subdomain.toLowerCase(),
                subscriptionPlanId: plan.id,
                status: 'TRIAL', // Default to TRIAL
                adminName,
                adminEmail: adminEmail.toLowerCase(),
                adminPhone,
                address,
                city,
                state,
                country,
                pinCode,
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
                dbName: `school_${subdomain.toLowerCase()}`, // Temporary, will update
                dbSchema: 'public' // Separate DB means we use public schema
            },
            include: {
                subscriptionPlan: true
            }
        });

        // Generate sequential Tenant ID (e.g. SCH-0001)
        const tenantId = `SCH-${String(school.sequenceId).padStart(4, '0')}`;
        const databaseName = `school_${tenantId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

        console.log(`🆔 Generated Tenant ID: ${tenantId}`);
        console.log(`💾 Target Database: ${databaseName}`);

        // Update school with generated ID and correct DB name
        school = await prisma.school.update({
            where: { id: school.id },
            data: {
                tenantId: tenantId,
                dbName: databaseName
            },
            include: {
                subscriptionPlan: true
            }
        });

        console.log('✅ School record updated with Tenant ID:', school.id);

        // 🆕 Automatically provision tenant database with schema and initial data
        console.log('🏗️  Provisioning tenant database...');
        const { createTenantDatabase } = require('../../utils/tenantProvisioning');
        // Pass the formatted tenantId so DB is named school_sch0001
        const provisionResult = await createTenantDatabase(tenantId, school.schoolName);

        if (!provisionResult.success) {
            console.error('⚠️  Tenant database provisioning failed:', provisionResult.message);
            // Continue anyway - we'll use ensureTenantSchema as fallback
        } else {
            console.log('✅ Tenant database provisioned successfully');
        }

        // Create Admin User in Tenant DB
        try {
            console.log('🔧 Creating admin user in tenant database for school:', school.id);
            console.log('📧 Admin email:', adminEmail.toLowerCase());
            console.log('🔑 Password (plain):', tempPassword);

            // Ensure schema exists before connecting (fallback if provisioning failed)
            await ensureTenantSchema(tenantId);

            const tenantDb = getTenantPrismaClient(tenantId);
            const hashedPassword = await hashPassword(tempPassword);

            console.log('🔒 Password hashed successfully');

            // Use upsert to handle duplicate emails (update if exists, create if not)
            const adminUser = await tenantDb.user.upsert({
                where: { email: adminEmail.toLowerCase() },
                update: {
                    fullName: adminName,
                    phone: adminPhone,
                    passwordHash: hashedPassword,
                    isActive: true,
                },
                create: {
                    fullName: adminName,
                    email: adminEmail.toLowerCase(),
                    phone: adminPhone,
                    role: 'SCHOOL_ADMIN',
                    passwordHash: hashedPassword,
                    isActive: true,
                },
            });

            console.log('✅ Admin user created/updated successfully in tenant DB:', adminUser.id);
        } catch (dbError) {
            console.error('❌ Failed to create admin user in tenant db:', dbError);
            console.error('Error details:', {
                message: dbError.message,
                code: dbError.code,
                meta: dbError.meta
            });

            // Log the error but don't fail the school creation
            console.warn('⚠️  School created but admin user creation failed. User can reset password to create account.');
        }

        // Send Welcome Email
        const loginUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`;

        try {
            await sendEmail({
                to: adminEmail,
                subject: 'Welcome to School CRM - Your Credentials',
                template: 'welcomeEmail',
                data: {
                    schoolName,
                    subdomain: school.subdomain,
                    loginUrl,
                    adminEmail,
                    password: tempPassword,
                    planName: school.subscriptionPlan?.planName || 'Trial Plan',
                    trialEndsAt: school.trialEndsAt
                }
            });
            console.log(`Welcome email sent to ${adminEmail}`);
        } catch (emailError) {
            console.error('Failed to send welcome email:', emailError);
            // Don't fail the request, just log it
        }

        // Log audit
        try {
            await prisma.platformAuditLog.create({
                data: {
                    user: req.user?.id ? { connect: { id: req.user.id } } : undefined,
                    school: { connect: { id: school.id } },
                    action: 'school_created',
                    resource: 'school',
                    resourceId: school.id,
                    details: { newValues: { schoolName, subdomain, adminEmail } },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        } catch (auditError) {
            console.error('Audit log failed:', auditError.message);
        }

        res.status(201).json({
            success: true,
            message: 'School created successfully',
            data: {
                school,
                credentials: {
                    adminEmail,
                    tempPassword, // Returning for immediate display since email might fail in dev
                    loginUrl
                }
            },
        });
    } catch (error) {
        console.error('Create school error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create school',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};
/**
 * Get all schools
 */
const getAllSchools = async (req, res) => {
    try {
        const {
            page = 1,
            limit = 20,
            search = '',
            status = '',
            planId = '',
        } = req.query;

        const skip = (parseInt(page) - 1) * parseInt(limit);

        // Build where clause
        const where = {};

        if (search) {
            where.OR = [
                { schoolName: { contains: search, mode: 'insensitive' } },
                { adminEmail: { contains: search, mode: 'insensitive' } },
                { adminName: { contains: search, mode: 'insensitive' } },
            ];
        }

        if (status) {
            where.status = status;
        }

        if (planId) {
            where.subscriptionPlanId = planId;
        }

        // Get schools with pagination
        const [schools, total] = await Promise.all([
            prisma.school.findMany({
                where,
                skip,
                take: parseInt(limit),
                include: {
                    subscriptionPlan: {
                        select: {
                            planName: true,
                            planCode: true,
                        },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.school.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                schools,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get schools error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch schools',
        });
    }
};

/**
 * Get school by ID
 */
const getSchoolById = async (req, res) => {
    try {
        const { id } = req.params;

        const school = await prisma.school.findUnique({
            where: { id },
            include: {
                subscriptionPlan: true,
                subscriptions: {
                    orderBy: { createdAt: 'desc' },
                    take: 1,
                },
                invoices: {
                    orderBy: { createdAt: 'desc' },
                    take: 5,
                },
            },
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'School not found',
            });
        }

        res.json({
            success: true,
            data: { school },
        });
    } catch (error) {
        console.error('Get school error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch school',
        });
    }
};

/**
 * Update school
 */
const updateSchool = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        // Check if school exists
        const existingSchool = await prisma.school.findUnique({
            where: { id },
        });

        if (!existingSchool) {
            return res.status(404).json({
                success: false,
                message: 'School not found',
            });
        }

        // Update school
        const school = await prisma.school.update({
            where: { id },
            data: updateData,
            include: {
                subscriptionPlan: true,
            },
        });

        // Log audit
        try {
            await prisma.platformAuditLog.create({
                data: {
                    user: req.user?.id ? { connect: { id: req.user.id } } : undefined,
                    school: { connect: { id: school.id } },
                    action: 'school_updated',
                    resource: 'school',
                    resourceId: school.id,
                    details: { oldValues: existingSchool, newValues: updateData },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        } catch (auditError) {
            console.error('Audit log failed:', auditError.message);
        }

        res.json({
            success: true,
            message: 'School updated successfully',
            data: { school },
        });
    } catch (error) {
        console.error('Update school error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update school',
        });
    }
};

/**
 * Suspend school
 */
const suspendSchool = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        const school = await prisma.school.update({
            where: { id },
            data: { status: 'SUSPENDED' },
        });

        // Log audit
        try {
            await prisma.platformAuditLog.create({
                data: {
                    user: req.user?.id ? { connect: { id: req.user.id } } : undefined,
                    school: { connect: { id: school.id } },
                    action: 'school_suspended',
                    resource: 'school',
                    resourceId: school.id,
                    details: { newValues: { reason } },
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        } catch (auditError) {
            console.error('Audit log failed:', auditError.message);
        }

        // TODO: Send notification to school admin

        res.json({
            success: true,
            message: 'School suspended successfully',
            data: { school },
        });
    } catch (error) {
        console.error('Suspend school error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to suspend school',
        });
    }
};

/**
 * Activate school
 */
const activateSchool = async (req, res) => {
    try {
        const { id } = req.params;

        const school = await prisma.school.update({
            where: { id },
            data: { status: 'ACTIVE' },
        });

        // Log audit
        try {
            await prisma.platformAuditLog.create({
                data: {
                    user: req.user?.id ? { connect: { id: req.user.id } } : undefined,
                    school: { connect: { id: school.id } },
                    action: 'school_activated',
                    resource: 'school',
                    resourceId: school.id,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        } catch (auditError) {
            console.error('Audit log failed:', auditError.message);
        }

        res.json({
            success: true,
            message: 'School activated successfully',
            data: { school },
        });
    } catch (error) {
        console.error('Activate school error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to activate school',
        });
    }
};

/**
 * Delete school
 */
const deleteSchool = async (req, res) => {
    try {
        const { id } = req.params;

        // Soft delete - update status to CANCELLED
        const school = await prisma.school.update({
            where: { id },
            data: { status: 'CANCELLED' },
        });

        // Log audit
        try {
            await prisma.platformAuditLog.create({
                data: {
                    user: req.user?.id ? { connect: { id: req.user.id } } : undefined,
                    school: { connect: { id: school.id } },
                    action: 'school_deleted',
                    resource: 'school',
                    resourceId: school.id,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        } catch (auditError) {
            console.error('Audit log failed:', auditError.message);
        }

        // TODO: Archive tenant database
        // TODO: Cancel subscriptions
        // TODO: Send final notification

        res.json({
            success: true,
            message: 'School deleted successfully',
        });
    } catch (error) {
        console.error('Delete school error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete school',
        });
    }
};

/**
 * Get platform analytics
 */
const getPlatformAnalytics = async (req, res) => {
    try {
        const [
            totalSchools,
            activeSchools,
            trialSchools,
            suspendedSchools,
            totalInvoices,
            paidInvoices,
            totalRevenue,
        ] = await Promise.all([
            prisma.school.count(),
            prisma.school.count({ where: { status: 'ACTIVE' } }),
            prisma.school.count({ where: { status: 'TRIAL' } }),
            prisma.school.count({ where: { status: 'SUSPENDED' } }),
            prisma.invoice.count(),
            prisma.invoice.count({ where: { status: 'PAID' } }),
            prisma.invoice.aggregate({
                where: { status: 'PAID' },
                _sum: { total: true },
            }),
        ]);

        res.json({
            success: true,
            data: {
                schools: {
                    total: totalSchools,
                    active: activeSchools,
                    trial: trialSchools,
                    suspended: suspendedSchools,
                },
                invoices: {
                    total: totalInvoices,
                    paid: paidInvoices,
                },
                revenue: {
                    total: totalRevenue._sum.total || 0,
                },
            },
        });
    } catch (error) {
        console.error('Get analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch analytics',
        });
    }
};

module.exports = {
    getAllSchools,
    getSchoolById,
    createSchool,
    updateSchool,
    suspendSchool,
    activateSchool,
    deleteSchool,
    getPlatformAnalytics,
};
