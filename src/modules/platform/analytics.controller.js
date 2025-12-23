const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get platform analytics dashboard
 * For SaaS owner to monitor business metrics
 */
const getPlatformAnalytics = async (req, res) => {
    try {
        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const startOfLastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        const endOfLastMonth = new Date(today.getFullYear(), today.getMonth(), 0);

        // 1. School Statistics
        const [totalSchools, activeSchools, trialSchools, suspendedSchools] = await Promise.all([
            prisma.school.count(),
            prisma.school.count({ where: { status: 'ACTIVE' } }),
            prisma.subscription.count({ where: { status: 'TRIAL' } }),
            prisma.school.count({ where: { status: 'SUSPENDED' } }),
        ]);

        // 2. Revenue Metrics
        const subscriptions = await prisma.subscription.findMany({
            where: { status: { in: ['ACTIVE', 'TRIAL'] } },
            include: { plan: true },
        });

        const mrr = subscriptions.reduce((sum, sub) => {
            return sum + Number(sub.plan.priceMonthly);
        }, 0);

        const arr = mrr * 12;

        // 3. User Statistics (across all tenants)
        const schools = await prisma.school.findMany({
            where: { status: 'ACTIVE' },
        });

        let totalStudents = 0;
        let totalTeachers = 0;
        const { getTenantPrismaClient } = require('../../utils/tenantDb');

        for (const school of schools) {
            try {
                const tenantDb = getTenantPrismaClient(school.id);
                const [students, teachers] = await Promise.all([
                    tenantDb.student.count({ where: { status: 'ACTIVE' } }),
                    tenantDb.teacher.count({ where: { isActive: true } }),
                ]);
                totalStudents += students;
                totalTeachers += teachers;
            } catch (error) {
                console.error(`Error fetching data for school ${school.id}:`, error);
            }
        }

        // 4. Plan Distribution
        const planDistribution = await prisma.subscription.groupBy({
            by: ['planId'],
            where: { status: { in: ['ACTIVE', 'TRIAL'] } },
            _count: true,
        });

        const planStats = await Promise.all(
            planDistribution.map(async (item) => {
                const plan = await prisma.subscriptionPlan.findUnique({
                    where: { id: item.planId },
                });
                return {
                    planName: plan.planName,
                    count: item._count,
                    revenue: Number(plan.priceMonthly) * item._count,
                };
            })
        );

        // 5. Recent Signups
        const recentSignups = await prisma.school.findMany({
            take: 10,
            orderBy: { onboardedAt: 'desc' },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });

        // 6. Churn Analysis
        const cancelledThisMonth = await prisma.subscription.count({
            where: {
                status: 'CANCELLED',
                updatedAt: {
                    gte: startOfMonth,
                },
            },
        });

        const cancelledLastMonth = await prisma.subscription.count({
            where: {
                status: 'CANCELLED',
                updatedAt: {
                    gte: startOfLastMonth,
                    lte: endOfLastMonth,
                },
            },
        });

        const churnRate = totalSchools > 0 ? (cancelledThisMonth / totalSchools) * 100 : 0;

        // 7. Support Ticket Stats
        const [openTickets, resolvedTickets, avgResolutionTime] = await Promise.all([
            prisma.supportTicket.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
            prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
            prisma.supportTicket.aggregate({
                where: { status: 'RESOLVED', resolvedAt: { not: null } },
                _avg: {
                    // Calculate average resolution time in hours
                    // This is a simplified version
                },
            }),
        ]);

        // 8. Growth Metrics
        const newSchoolsThisMonth = await prisma.school.count({
            where: {
                onboardedAt: {
                    gte: startOfMonth,
                },
            },
        });

        const newSchoolsLastMonth = await prisma.school.count({
            where: {
                onboardedAt: {
                    gte: startOfLastMonth,
                    lte: endOfLastMonth,
                },
            },
        });

        const growthRate = newSchoolsLastMonth > 0
            ? ((newSchoolsThisMonth - newSchoolsLastMonth) / newSchoolsLastMonth) * 100
            : 0;

        res.json({
            success: true,
            data: {
                overview: {
                    totalSchools,
                    activeSchools,
                    trialSchools,
                    suspendedSchools,
                    totalStudents,
                    totalTeachers,
                },
                revenue: {
                    mrr: Math.round(mrr),
                    arr: Math.round(arr),
                    avgRevenuePerSchool: totalSchools > 0 ? Math.round(mrr / totalSchools) : 0,
                    currency: 'INR',
                },
                growth: {
                    newSchoolsThisMonth,
                    newSchoolsLastMonth,
                    growthRate: Math.round(growthRate * 100) / 100,
                    churnRate: Math.round(churnRate * 100) / 100,
                    cancelledThisMonth,
                    cancelledLastMonth,
                },
                plans: {
                    distribution: planStats,
                },
                support: {
                    openTickets,
                    resolvedTickets,
                    totalTickets: openTickets + resolvedTickets,
                },
                recentActivity: {
                    recentSignups: recentSignups.map(school => ({
                        id: school.id,
                        schoolName: school.schoolName,
                        subdomain: school.subdomain,
                        plan: school.subscription?.plan?.planName,
                        onboardedAt: school.onboardedAt,
                    })),
                },
            },
        });
    } catch (error) {
        console.error('Platform analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch platform analytics',
        });
    }
};

/**
 * Get revenue analytics
 */
const getRevenueAnalytics = async (req, res) => {
    try {
        const { period = 'month' } = req.query; // month, quarter, year

        // Get all paid invoices
        const invoices = await prisma.invoice.findMany({
            where: {
                status: 'PAID',
            },
            include: {
                school: true,
            },
            orderBy: {
                paidAt: 'desc',
            },
        });

        // Group by period
        const revenueByPeriod = {};
        invoices.forEach(invoice => {
            const date = new Date(invoice.paidAt);
            let key;

            if (period === 'month') {
                key = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            } else if (period === 'quarter') {
                const quarter = Math.floor(date.getMonth() / 3) + 1;
                key = `${date.getFullYear()}-Q${quarter}`;
            } else {
                key = date.getFullYear().toString();
            }

            if (!revenueByPeriod[key]) {
                revenueByPeriod[key] = 0;
            }
            revenueByPeriod[key] += Number(invoice.amount);
        });

        res.json({
            success: true,
            data: {
                period,
                revenue: Object.entries(revenueByPeriod).map(([period, amount]) => ({
                    period,
                    amount: Math.round(amount),
                })),
                totalRevenue: Math.round(invoices.reduce((sum, inv) => sum + Number(inv.amount), 0)),
            },
        });
    } catch (error) {
        console.error('Revenue analytics error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch revenue analytics',
        });
    }
};

/**
 * Get school health metrics
 */
const getSchoolHealth = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });

        const { getTenantPrismaClient } = require('../../utils/tenantDb');
        const tenantDb = getTenantPrismaClient(schoolId);

        const [students, teachers, activeUsers, pendingFees] = await Promise.all([
            tenantDb.student.count({ where: { status: 'ACTIVE' } }),
            tenantDb.teacher.count({ where: { isActive: true } }),
            tenantDb.user.count({ where: { isActive: true } }),
            tenantDb.feeInvoice.aggregate({
                where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
                _sum: { total: true },
            }),
        ]);

        const plan = school.subscription?.plan;
        const usagePercentage = {
            students: plan ? Math.round((students / plan.maxStudents) * 100) : 0,
            teachers: plan ? Math.round((teachers / plan.maxTeachers) * 100) : 0,
        };

        res.json({
            success: true,
            data: {
                school: {
                    id: school.id,
                    name: school.schoolName,
                    status: school.status,
                },
                usage: {
                    students: {
                        current: students,
                        limit: plan?.maxStudents || 0,
                        percentage: usagePercentage.students,
                    },
                    teachers: {
                        current: teachers,
                        limit: plan?.maxTeachers || 0,
                        percentage: usagePercentage.teachers,
                    },
                    activeUsers,
                },
                financial: {
                    pendingFees: Number(pendingFees._sum.total) || 0,
                },
                health: {
                    status: usagePercentage.students > 90 || usagePercentage.teachers > 90 ? 'WARNING' : 'HEALTHY',
                    warnings: [
                        ...(usagePercentage.students > 90 ? ['Student limit approaching'] : []),
                        ...(usagePercentage.teachers > 90 ? ['Teacher limit approaching'] : []),
                    ],
                },
            },
        });
    } catch (error) {
        console.error('School health error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch school health',
        });
    }
};

module.exports = {
    getPlatformAnalytics,
    getRevenueAnalytics,
    getSchoolHealth,
};
