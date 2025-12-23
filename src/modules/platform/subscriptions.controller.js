const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const getAllPlans = async (req, res) => {
    try {
        const where = {};
        // Only fitler by active unless 'includeInactive' is true
        if (req.query.includeInactive !== 'true') {
            where.isActive = true;
        }

        const plans = await prisma.subscriptionPlan.findMany({
            where,
            orderBy: { priceMonthly: 'asc' },
        });

        res.json({ success: true, data: { plans } });
    } catch (error) {
        console.error('Get plans error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch plans' });
    }
};

const createPlan = async (req, res) => {
    try {
        const { planName, planCode, priceMonthly, priceYearly, maxStudents, maxTeachers, maxStorageGb, features } = req.body;

        const plan = await prisma.subscriptionPlan.create({
            data: {
                planName,
                planCode,
                priceMonthly,
                priceYearly,
                maxStudents,
                maxTeachers,
                maxStorageGb,
                features,
                isActive: true,
            },
        });

        res.status(201).json({ success: true, data: { plan } });
    } catch (error) {
        console.error('Create plan error:', error);
        res.status(500).json({ success: false, message: 'Failed to create plan' });
    }
};

const updatePlan = async (req, res) => {
    try {
        const { id } = req.params;
        const { planName, planCode, priceMonthly, priceYearly, maxStudents, maxTeachers, maxStorageGb, features, isActive } = req.body;

        const plan = await prisma.subscriptionPlan.update({
            where: { id },
            data: {
                planName,
                planCode,
                priceMonthly,
                priceYearly,
                maxStudents,
                maxTeachers,
                maxStorageGb,
                features,
                isActive, // Allow updating status
            },
        });

        res.json({ success: true, data: { plan } });
    } catch (error) {
        console.error('Update plan error:', error);
        res.status(500).json({ success: false, message: 'Failed to update plan' });
    }
};

const deletePlan = async (req, res) => {
    try {
        const { id } = req.params;

        // Check if plan is used by any subscription
        const usageCount = await prisma.subscription.count({
            where: { planId: id }
        });

        if (usageCount > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete plan because it is being used by existing subscriptions. Please deactivate it instead.'
            });
        }

        await prisma.subscriptionPlan.delete({
            where: { id }
        });

        res.json({ success: true, message: 'Plan deleted successfully' });
    } catch (error) {
        console.error('Delete plan error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete plan' });
    }
};

module.exports = {
    getAllPlans,
    createPlan,
    updatePlan,
    deletePlan,
};
