const { getTenantPrismaClient } = require('../../utils/tenantDb');

const getDashboard = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const [
            totalStudents,
            totalTeachers,
            totalClasses,
            activeStudents,
            pendingFees,
            todayAttendance,
            upcomingExams,
            recentAdmissions,
        ] = await Promise.all([
            tenantDb.student.count(),
            tenantDb.teacher.count(),
            tenantDb.class.count(),
            tenantDb.student.count({ where: { status: 'ACTIVE' } }),
            tenantDb.feeInvoice.aggregate({
                where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
                _sum: { balance: true },
            }),
            tenantDb.attendance.count({
                where: {
                    date: {
                        gte: new Date(new Date().setHours(0, 0, 0, 0)),
                        lt: new Date(new Date().setHours(23, 59, 59, 999)),
                    },
                    status: 'PRESENT',
                },
            }),
            tenantDb.exam.findMany({
                where: {
                    startDate: { gte: new Date() },
                },
                take: 5,
                orderBy: { startDate: 'asc' },
                include: {
                    class: { select: { className: true, section: true } },
                },
            }),
            tenantDb.student.findMany({
                where: {
                    admissionDate: {
                        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
                    },
                },
                take: 10,
                orderBy: { admissionDate: 'desc' },
                include: {
                    user: { select: { fullName: true } },
                    class: { select: { className: true, section: true } },
                },
            }),
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalStudents,
                    totalTeachers,
                    totalClasses,
                    activeStudents,
                    pendingFees: Number(pendingFees._sum.balance) || 0,
                    todayAttendance,
                },
                upcomingExams,
                recentAdmissions,
            },
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
    }
};

const getDashboardOverview = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const [totalStudents, totalTeachers, totalClasses, pendingFees] = await Promise.all([
            tenantDb.student.count({ where: { status: 'ACTIVE' } }),
            tenantDb.teacher.count({ where: { status: 'ACTIVE' } }),
            tenantDb.class.count(),
            tenantDb.feeInvoice.aggregate({
                where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
                _sum: { total: true },
            }),
        ]);

        res.json({
            success: true,
            data: {
                totalStudents,
                totalTeachers,
                totalClasses,
                pendingFees: Number(pendingFees._sum.total) || 0,
            },
        });
    } catch (error) {
        console.error('Dashboard overview error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch overview' });
    }
};

const getDashboardStats = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const today = new Date();
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

        const [
            monthlyAdmissions,
            monthlyFeeCollection,
            averageAttendance,
            activeTransportRoutes,
        ] = await Promise.all([
            tenantDb.student.count({
                where: {
                    admissionDate: { gte: startOfMonth },
                },
            }),
            tenantDb.feePayment.aggregate({
                where: {
                    paymentDate: { gte: startOfMonth },
                },
                _sum: { amount: true },
            }),
            tenantDb.attendance.aggregate({
                where: {
                    date: { gte: startOfMonth },
                    status: 'PRESENT',
                },
                _count: true,
            }),
            tenantDb.transportRoute.count(),
        ]);

        res.json({
            success: true,
            data: {
                monthlyAdmissions,
                monthlyFeeCollection: Number(monthlyFeeCollection._sum.amount) || 0,
                averageAttendance: averageAttendance._count,
                activeTransportRoutes,
            },
        });
    } catch (error) {
        console.error('Dashboard stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch stats' });
    }
};

const getDashboardCharts = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Get last 7 days attendance data
        const last7Days = Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - i);
            return date;
        }).reverse();

        const attendanceData = await Promise.all(
            last7Days.map(async (date) => {
                const count = await tenantDb.attendance.count({
                    where: {
                        date: {
                            gte: new Date(date.setHours(0, 0, 0, 0)),
                            lt: new Date(date.setHours(23, 59, 59, 999)),
                        },
                        status: 'PRESENT',
                    },
                });
                return {
                    date: date.toISOString().split('T')[0],
                    count,
                };
            })
        );

        // Get fee collection by month (last 6 months)
        const feeCollectionData = await tenantDb.feePayment.groupBy({
            by: ['paymentDate'],
            _sum: { amount: true },
            where: {
                paymentDate: {
                    gte: new Date(new Date().setMonth(new Date().getMonth() - 6)),
                },
            },
        });

        res.json({
            success: true,
            data: {
                attendanceChart: attendanceData,
                feeCollectionChart: feeCollectionData,
            },
        });
    } catch (error) {
        console.error('Dashboard charts error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch charts data' });
    }
};

const getRecentActivities = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const activities = await tenantDb.auditLog.findMany({
            take: 20,
            orderBy: { createdAt: 'desc' },
            include: {
                user: { select: { fullName: true } },
            },
        });

        res.json({ success: true, data: { activities } });
    } catch (error) {
        console.error('Recent activities error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch activities' });
    }
};

module.exports = {
    getDashboard,
    getDashboardOverview,
    getDashboardStats,
    getDashboardCharts,
    getRecentActivities,
};
