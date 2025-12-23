const { PrismaClient } = require('@prisma/client');
const { exec } = require('child_process');
const { promisify } = require('util');
const bcrypt = require('bcryptjs');
const execAsync = promisify(exec);

const prisma = new PrismaClient();

/**
 * Create new school tenant
 * This handles complete school onboarding:
 * 1. Create school in platform DB
 * 2. Create tenant database
 * 3. Run migrations
 * 4. Create admin user
 * 5. Assign subdomain
 * 6. Create subscription
 */
const createSchool = async (req, res) => {
    try {
        const {
            schoolName,
            subdomain,
            adminName,
            adminEmail,
            adminPhone,
            address,
            city,
            state,
            pinCode,
            subscriptionPlanId,
        } = req.body;

        // 1. Validate subdomain availability
        const existingSchool = await prisma.school.findFirst({
            where: { subdomain },
        });

        if (existingSchool) {
            return res.status(400).json({
                success: false,
                message: 'Subdomain already taken',
            });
        }

        // 2. Create school in platform database
        const school = await prisma.school.create({
            data: {
                schoolName,
                subdomain,
                domain: `${subdomain}.schoolcrm.com`,
                contactEmail: adminEmail,
                contactPhone: adminPhone,
                address,
                city,
                state,
                pinCode,
                status: 'ACTIVE',
                onboardedAt: new Date(),
            },
        });

        // 3. Create tenant database
        const tenantDbName = `school_${school.id.replace(/-/g, '_')}`;

        try {
            // Create database
            await execAsync(`createdb ${tenantDbName}`);

            // Run migrations on tenant database
            const tenantDbUrl = `postgresql://user:password@localhost:5432/${tenantDbName}`;
            process.env.DATABASE_URL = tenantDbUrl;

            await execAsync('npx prisma migrate deploy --schema=./prisma/tenant-schema.prisma');

            // Update school with database info
            await prisma.school.update({
                where: { id: school.id },
                data: {
                    databaseName: tenantDbName,
                    databaseUrl: tenantDbUrl,
                },
            });
        } catch (dbError) {
            console.error('Database creation error:', dbError);
            // Rollback school creation
            await prisma.school.delete({ where: { id: school.id } });
            throw new Error('Failed to create tenant database');
        }

        // 4. Create admin user in tenant database
        const { getTenantPrismaClient } = require('../../utils/tenantDb');
        const tenantDb = getTenantPrismaClient(school.id);

        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        await tenantDb.user.create({
            data: {
                fullName: adminName,
                email: adminEmail,
                phone: adminPhone,
                passwordHash: hashedPassword,
                role: 'SCHOOL_ADMIN',
                isActive: true,
            },
        });

        // 5. Create subscription
        const plan = await prisma.subscriptionPlan.findUnique({
            where: { id: subscriptionPlanId },
        });

        await prisma.subscription.create({
            data: {
                schoolId: school.id,
                planId: subscriptionPlanId,
                status: 'TRIAL',
                startDate: new Date(),
                endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days trial
                autoRenew: true,
            },
        });

        // 6. Send welcome email (TODO: integrate email service)
        // await sendWelcomeEmail(adminEmail, {
        //   schoolName,
        //   subdomain,
        //   loginUrl: `https://${subdomain}.schoolcrm.com`,
        //   email: adminEmail,
        //   password,
        // });

        res.status(201).json({
            success: true,
            message: 'School onboarded successfully',
            data: {
                school: {
                    id: school.id,
                    schoolName: school.schoolName,
                    subdomain: school.subdomain,
                    loginUrl: `https://${subdomain}.schoolcrm.com`,
                },
                credentials: {
                    email: adminEmail,
                    password, // Send via email in production
                },
                subscription: {
                    plan: plan.planName,
                    status: 'TRIAL',
                    trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
                },
            },
        });
    } catch (error) {
        console.error('School creation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create school',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Suspend school (for non-payment)
 */
const suspendSchool = async (req, res) => {
    try {
        const { id } = req.params;
        const { reason } = req.body;

        await prisma.school.update({
            where: { id },
            data: {
                status: 'SUSPENDED',
                suspendedAt: new Date(),
                suspensionReason: reason,
            },
        });

        // TODO: Send suspension email
        // TODO: Block all logins for this school

        res.json({
            success: true,
            message: 'School suspended successfully',
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

        await prisma.school.update({
            where: { id },
            data: {
                status: 'ACTIVE',
                suspendedAt: null,
                suspensionReason: null,
            },
        });

        res.json({
            success: true,
            message: 'School activated successfully',
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
 * Delete school (with all data)
 */
const deleteSchool = async (req, res) => {
    try {
        const { id } = req.params;

        const school = await prisma.school.findUnique({ where: { id } });

        // 1. Delete tenant database
        if (school.databaseName) {
            await execAsync(`dropdb ${school.databaseName}`);
        }

        // 2. Delete school from platform
        await prisma.school.delete({ where: { id } });

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

function generateRandomPassword(length = 12) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    return password;
}

module.exports = {
    createSchool,
    suspendSchool,
    activateSchool,
    deleteSchool,
};
