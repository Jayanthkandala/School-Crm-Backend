const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Check if school has access to a specific feature
 */
const checkFeatureAccess = (featureName) => {
    return async (req, res, next) => {
        try {
            const { tenantId } = req.user;

            // Get school's subscription
            const school = await prisma.school.findUnique({
                where: { id: tenantId },
                include: {
                    subscription: {
                        include: {
                            plan: true,
                        },
                    },
                },
            });

            if (!school || !school.subscription) {
                return res.status(403).json({
                    success: false,
                    message: 'No active subscription found',
                });
            }

            const { plan } = school.subscription;
            const features = plan.features || {};

            // Check if feature is enabled in plan
            if (!features[featureName]) {
                return res.status(403).json({
                    success: false,
                    message: `This feature is not available in your ${plan.planName} plan`,
                    upgrade: {
                        currentPlan: plan.planName,
                        requiredPlan: getRequiredPlan(featureName),
                        upgradeUrl: '/upgrade',
                    },
                });
            }

            next();
        } catch (error) {
            console.error('Feature check error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check feature access',
            });
        }
    };
};

/**
 * Check usage limits (students, teachers, storage)
 */
const checkUsageLimit = (resourceType) => {
    return async (req, res, next) => {
        try {
            const { tenantId } = req.user;

            // Get school's subscription plan
            const school = await prisma.school.findUnique({
                where: { id: tenantId },
                include: {
                    subscription: {
                        include: {
                            plan: true,
                        },
                    },
                },
            });

            const { plan } = school.subscription;
            const { getTenantPrismaClient } = require('../utils/tenantDb');
            const tenantDb = getTenantPrismaClient(tenantId);

            let currentCount = 0;
            let limit = 0;

            // Check based on resource type
            switch (resourceType) {
                case 'STUDENTS':
                    currentCount = await tenantDb.student.count({ where: { status: 'ACTIVE' } });
                    limit = plan.maxStudents;
                    break;

                case 'TEACHERS':
                    currentCount = await tenantDb.teacher.count({ where: { isActive: true } });
                    limit = plan.maxTeachers;
                    break;

                case 'STORAGE':
                    // TODO: Calculate actual storage usage
                    currentCount = 0; // GB
                    limit = plan.maxStorageGb;
                    break;

                default:
                    return next();
            }

            if (currentCount >= limit) {
                return res.status(403).json({
                    success: false,
                    message: `You've reached the limit for ${resourceType.toLowerCase()}`,
                    usage: {
                        current: currentCount,
                        limit: limit,
                        percentage: Math.round((currentCount / limit) * 100),
                    },
                    upgrade: {
                        currentPlan: plan.planName,
                        message: 'Upgrade your plan to add more ' + resourceType.toLowerCase(),
                        upgradeUrl: '/upgrade',
                    },
                });
            }

            // Add usage info to request
            req.usage = {
                current: currentCount,
                limit: limit,
                remaining: limit - currentCount,
            };

            next();
        } catch (error) {
            console.error('Usage limit check error:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to check usage limit',
            });
        }
    };
};

/**
 * Check if subscription is active
 */
const checkSubscriptionStatus = async (req, res, next) => {
    try {
        const { tenantId } = req.user;

        const school = await prisma.school.findUnique({
            where: { id: tenantId },
            include: {
                subscription: true,
            },
        });

        if (!school.subscription) {
            return res.status(403).json({
                success: false,
                message: 'No subscription found',
            });
        }

        const { subscription } = school;

        // Check if subscription is active
        if (subscription.status === 'CANCELLED') {
            return res.status(403).json({
                success: false,
                message: 'Your subscription has been cancelled',
            });
        }

        if (subscription.status === 'EXPIRED') {
            return res.status(403).json({
                success: false,
                message: 'Your subscription has expired. Please renew.',
                renewUrl: '/renew',
            });
        }

        // Check if subscription end date has passed
        if (new Date() > new Date(subscription.endDate)) {
            // Auto-expire subscription
            await prisma.subscription.update({
                where: { id: subscription.id },
                data: { status: 'EXPIRED' },
            });

            return res.status(403).json({
                success: false,
                message: 'Your subscription has expired. Please renew.',
                renewUrl: '/renew',
            });
        }

        next();
    } catch (error) {
        console.error('Subscription check error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check subscription status',
        });
    }
};

/**
 * Get required plan for a feature
 */
function getRequiredPlan(featureName) {
    const featurePlans = {
        transport: 'PRO',
        certificates: 'PRO',
        library: 'BASIC',
        communication: 'BASIC',
        reports: 'PRO',
        analytics: 'ENTERPRISE',
    };

    return featurePlans[featureName] || 'PRO';
}

module.exports = {
    checkFeatureAccess,
    checkUsageLimit,
    checkSubscriptionStatus,
};
