const { getTenantPrismaClient } = require('../../utils/tenantDb');

const getAttendanceReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, startDate, endDate } = req.query;

        const where = {
            ...(classId && { student: { classId } }),
            ...(startDate && endDate && {
                date: {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                },
            }),
        };

        const attendance = await tenantDb.attendance.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true } },
                        class: { select: { className: true, section: true } },
                    },
                },
            },
        });

        const summary = {
            totalRecords: attendance.length,
            present: attendance.filter(a => a.status === 'PRESENT').length,
            absent: attendance.filter(a => a.status === 'ABSENT').length,
            late: attendance.filter(a => a.status === 'LATE').length,
        };

        res.json({ success: true, data: { attendance, summary } });
    } catch (error) {
        console.error('Attendance report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate attendance report' });
    }
};

const getAcademicReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, examId } = req.query;

        const where = {
            ...(classId && { student: { classId } }),
            ...(examId && { examId }),
        };

        const grades = await tenantDb.grade.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true } },
                        class: { select: { className: true } },
                    },
                },
                exam: { select: { name: true } },
                subject: { select: { name: true } },
            },
        });

        res.json({ success: true, data: { grades, count: grades.length } });
    } catch (error) {
        console.error('Academic report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate academic report' });
    }
};

const getStudentReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, status } = req.query;

        const where = {
            ...(classId && { classId }),
            ...(status && { status }),
        };

        const students = await tenantDb.student.findMany({
            where,
            include: {
                user: { select: { fullName: true, email: true, phone: true } },
                class: { select: { className: true, section: true } },
            },
        });

        res.json({ success: true, data: { students, count: students.length } });
    } catch (error) {
        console.error('Student report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate student report' });
    }
};

const getTeacherReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { status } = req.query;

        const teachers = await tenantDb.teacher.findMany({
            where: status ? {
                status: status.toUpperCase()
            } : {},
            include: {
                user: { select: { fullName: true, email: true, phone: true } },
                classes: { include: { class: true } },
                subjects: { include: { subject: true } },
            },
        });

        res.json({ success: true, data: { teachers, count: teachers.length } });
    } catch (error) {
        console.error('Teacher report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate teacher report' });
    }
};

const getFeesReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, status } = req.query;

        const where = {
            ...(classId && { student: { classId } }),
            ...(status && { status }),
        };

        const invoices = await tenantDb.feeInvoice.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true } },
                        class: { select: { className: true } },
                    },
                },
                payments: true,
            },
        });

        const summary = {
            totalInvoices: invoices.length,
            totalAmount: invoices.reduce((sum, inv) => sum + inv.total, 0),
            totalPaid: invoices.reduce((sum, inv) => sum + inv.paid, 0),
            totalBalance: invoices.reduce((sum, inv) => sum + inv.balance, 0),
        };

        res.json({ success: true, data: { invoices, summary } });
    } catch (error) {
        console.error('Fees report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate fees report' });
    }
};

const getDashboardAnalytics = async (req, res) => {
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
                },
            }),
        ]);

        res.json({
            success: true,
            data: {
                totalStudents,
                totalTeachers,
                totalClasses,
                activeStudents,
                pendingFees: pendingFees._sum.balance || 0,
                todayAttendance,
            },
        });
    } catch (error) {
        console.error('Dashboard analytics error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
    }
};

const getCustomReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { reportType, filters } = req.body;

        // TODO: Implement custom report generation based on reportType
        res.json({
            success: true,
            message: 'Custom report generation',
            data: { reportType, filters },
        });
    } catch (error) {
        console.error('Custom report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate custom report' });
    }
};

const exportReport = async (req, res) => {
    try {
        const { reportType, format } = req.query;

        // TODO: Implement report export (PDF/Excel)
        res.json({
            success: true,
            message: `Export ${reportType} as ${format}`,
        });
    } catch (error) {
        console.error('Export report error:', error);
        res.status(500).json({ success: false, message: 'Failed to export report' });
    }
};

module.exports = {
    getAttendanceReport,
    getAcademicReport,
    getFeesReport,
    getFeeReport: getFeesReport, // Alias for route compatibility
    getStudentReport, // Added
    getTeacherReport, // Added
    getDashboardAnalytics,
    getCustomReport,
    exportReport,
};
