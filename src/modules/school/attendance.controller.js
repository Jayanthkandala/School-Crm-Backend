const { getTenantPrismaClient } = require('../../utils/tenantDb');
const { calculateAttendancePercentage } = require('../../utils/calculations');

const markAttendance = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, date, attendanceRecords } = req.body;

        // Validate date
        const attendanceDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        attendanceDate.setHours(0, 0, 0, 0);

        // Check if date is in the future
        if (attendanceDate > today) {
            return res.status(400).json({
                success: false,
                message: 'Cannot mark attendance for future dates'
            });
        }

        // Check if date is too old (more than 30 days)
        const thirtyDaysAgo = new Date(today);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        if (attendanceDate < thirtyDaysAgo) {
            return res.status(400).json({
                success: false,
                message: 'Cannot mark attendance for dates older than 30 days. Please contact admin.'
            });
        }

        for (const record of attendanceRecords) {
            await tenantDb.attendance.upsert({
                where: {
                    studentId_date: {
                        studentId: record.studentId,
                        date: attendanceDate,
                    },
                },
                update: {
                    status: record.status,
                    remarks: record.remarks,
                },
                create: {
                    studentId: record.studentId,
                    classId,
                    date: attendanceDate,
                    status: record.status,
                    remarks: record.remarks,
                },
            });
        }

        res.json({ success: true, message: 'Attendance marked successfully' });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark attendance' });
    }
};

const getClassAttendance = async (req, res) => {
    try {
        const { classId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { date } = req.query;

        const attendance = await tenantDb.attendance.findMany({
            where: {
                classId,
                date: new Date(date),
            },
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true } },
                    },
                },
            },
        });

        res.json({ success: true, data: { attendance } });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
    }
};

const getStudentAttendance = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { fromDate, toDate } = req.query;

        const where = { studentId };
        if (fromDate && toDate) {
            where.date = {
                gte: new Date(fromDate),
                lte: new Date(toDate),
            };
        }

        const [attendance, total, present] = await Promise.all([
            tenantDb.attendance.findMany({ where, orderBy: { date: 'desc' } }),
            tenantDb.attendance.count({ where }),
            tenantDb.attendance.count({ where: { ...where, status: 'PRESENT' } }),
        ]);

        const percentage = calculateAttendancePercentage(present, total);

        res.json({
            success: true,
            data: {
                attendance,
                summary: { total, present, absent: total - present, percentage },
            },
        });
    } catch (error) {
        console.error('Get student attendance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
    }
};

const getAttendanceReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, fromDate, toDate } = req.query;

        const students = await tenantDb.student.findMany({
            where: { classId, status: 'ACTIVE' },
            include: { user: { select: { fullName: true } } },
        });

        const report = [];
        for (const student of students) {
            const [total, present] = await Promise.all([
                tenantDb.attendance.count({
                    where: {
                        studentId: student.id,
                        date: { gte: new Date(fromDate), lte: new Date(toDate) },
                    },
                }),
                tenantDb.attendance.count({
                    where: {
                        studentId: student.id,
                        status: 'PRESENT',
                        date: { gte: new Date(fromDate), lte: new Date(toDate) },
                    },
                }),
            ]);

            report.push({
                studentId: student.id,
                studentName: student.user.fullName,
                total,
                present,
                absent: total - present,
                percentage: calculateAttendancePercentage(present, total),
            });
        }

        res.json({ success: true, data: { report } });
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
};

// Additional controller functions
const getDailyAttendance = getClassAttendance;
const getStudentMonthlyAttendance = getStudentAttendance;
const getClassMonthlyAttendance = getClassAttendance;


const getDefaulters = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, threshold = 75, fromDate, toDate } = req.query;

        const where = {
            classId: classId || undefined,
            status: 'ACTIVE'
        };

        const students = await tenantDb.student.findMany({
            where,
            include: { user: { select: { fullName: true, email: true, phone: true } } }
        });

        const defaulters = [];
        const dateFilter = {};
        if (fromDate && toDate) {
            dateFilter.date = {
                gte: new Date(fromDate),
                lte: new Date(toDate)
            };
        }

        for (const student of students) {
            const [total, present] = await Promise.all([
                tenantDb.attendance.count({
                    where: { studentId: student.id, ...dateFilter }
                }),
                tenantDb.attendance.count({
                    where: { studentId: student.id, status: 'PRESENT', ...dateFilter }
                })
            ]);

            const percentage = calculateAttendancePercentage(present, total);

            if (total > 0 && percentage < parseFloat(threshold)) {
                defaulters.push({
                    studentId: student.id,
                    studentName: student.user.fullName,
                    admissionNumber: student.admissionNumber,
                    email: student.user.email,
                    phone: student.user.phone,
                    totalDays: total,
                    presentDays: present,
                    absentDays: total - present,
                    percentage
                });
            }
        }

        // Sort by percentage (lowest first)
        defaulters.sort((a, b) => a.percentage - b.percentage);

        res.json({ success: true, data: { defaulters, threshold: parseFloat(threshold) } });
    } catch (error) {
        console.error('getDefaulters error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch defaulters' });
    }
};

const submitLeaveRequest = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { studentId, fromDate, toDate, reason, leaveType } = req.body;

        if (!studentId || !fromDate || !toDate || !reason) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Check if student exists
        const student = await tenantDb.student.findUnique({ where: { id: studentId } });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Create leave request
        const leaveRequest = await tenantDb.studentLeaveRequest.create({
            data: {
                studentId,
                fromDate: new Date(fromDate),
                toDate: new Date(toDate),
                reason,
                leaveType: leaveType || 'SICK',
                status: 'PENDING'
            }
        });

        res.status(201).json({
            success: true,
            message: 'Leave request submitted successfully',
            data: { leaveRequest }
        });
    } catch (error) {
        console.error('submitLeaveRequest error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit leave request' });
    }
};

const updateLeaveStatus = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { id } = req.params;
        const { status, remarks } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        // Update leave status
        const leaveRequest = await tenantDb.studentLeaveRequest.update({
            where: { id },
            data: {
                status,
                remarks
            },
            include: { student: true }
        });

        // If approved, mark attendance for the leave period
        if (status === 'APPROVED') {
            const start = new Date(leaveRequest.fromDate);
            const end = new Date(leaveRequest.toDate);

            // Loop through dates
            for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
                // Skip Sundays or holidays if implemented
                if (d.getDay() === 0) continue;

                await tenantDb.attendance.upsert({
                    where: {
                        studentId_date: {
                            studentId: leaveRequest.studentId,
                            date: new Date(d)
                        }
                    },
                    update: {
                        status: 'LEAVE',
                        remarks: 'Leave Approved: ' + leaveRequest.leaveType
                    },
                    create: {
                        studentId: leaveRequest.studentId,
                        classId: leaveRequest.student.classId,
                        date: new Date(d),
                        status: 'LEAVE',
                        remarks: 'Leave Approved: ' + leaveRequest.leaveType
                    }
                });
            }
        }

        res.json({
            success: true,
            message: `Leave request ${status.toLowerCase()} successfully`,
            data: { leaveRequest }
        });
    } catch (error) {
        console.error('updateLeaveStatus error:', error);
        res.status(500).json({ success: false, message: 'Failed to update leave status' });
    }
};

const getAllLeaveRequests = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { status } = req.query;

        const where = {};
        if (status) where.status = status;

        const leaves = await tenantDb.studentLeaveRequest.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true } },
                        class: { select: { className: true, section: true } }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { leaves }
        });
    } catch (error) {
        console.error('getAllLeaveRequests error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch leave requests',
            error: error.message
        });
    }
};

const sendAttendanceNotifications = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { date, classId } = req.body;

        // Get absent students
        const absentRecords = await tenantDb.attendance.findMany({
            where: {
                date: new Date(date),
                classId: classId || undefined,
                status: 'ABSENT'
            },
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true, email: true, phone: true } },
                        parents: {
                            include: {
                                parent: {
                                    include: {
                                        user: { select: { fullName: true, email: true, phone: true } }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        const notifications = [];
        for (const record of absentRecords) {
            const student = record.student;

            // Collect parent contacts
            const parentContacts = student.parents.map(sp => ({
                name: sp.parent.user.fullName,
                email: sp.parent.user.email,
                phone: sp.parent.user.phone
            }));

            notifications.push({
                studentName: student.user.fullName,
                admissionNumber: student.admissionNumber,
                date: record.date,
                parentContacts,
                message: `Your child ${student.user.fullName} was absent on ${new Date(date).toLocaleDateString()}`
            });
        }

        // In production, this would integrate with SMS/Email service
        // For now, we return the notification data

        res.json({
            success: true,
            message: `${notifications.length} notifications prepared`,
            data: { notifications }
        });
    } catch (error) {
        console.error('sendAttendanceNotifications error:', error);
        res.status(500).json({ success: false, message: 'Failed to send notifications' });
    }
};

const getAttendanceStats = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { month, year, classId } = req.query;

        let dateFilter = {};
        if (month && year) {
            const startDate = new Date(year, month - 1, 1);
            const endDate = new Date(year, month, 0);
            dateFilter = {
                date: {
                    gte: startDate,
                    lte: endDate
                }
            };
        }

        const where = {
            classId: classId || undefined,
            ...dateFilter
        };

        const [totalRecords, presentRecords, absentRecords, lateRecords] = await Promise.all([
            tenantDb.attendance.count({ where }),
            tenantDb.attendance.count({ where: { ...where, status: 'PRESENT' } }),
            tenantDb.attendance.count({ where: { ...where, status: 'ABSENT' } }),
            tenantDb.attendance.count({ where: { ...where, status: 'LATE' } })
        ]);

        const overallPercentage = calculateAttendancePercentage(presentRecords, totalRecords);

        // Class-wise breakdown if no specific class
        let classBreakdown = [];
        if (!classId) {
            const classes = await tenantDb.class.findMany({
                select: { id: true, className: true, section: true }
            });

            for (const cls of classes) {
                const [classTotal, classPresent] = await Promise.all([
                    tenantDb.attendance.count({ where: { ...dateFilter, classId: cls.id } }),
                    tenantDb.attendance.count({ where: { ...dateFilter, classId: cls.id, status: 'PRESENT' } })
                ]);

                if (classTotal > 0) {
                    classBreakdown.push({
                        classId: cls.id,
                        className: `${cls.className} - ${cls.section}`,
                        totalRecords: classTotal,
                        presentRecords: classPresent,
                        percentage: calculateAttendancePercentage(classPresent, classTotal)
                    });
                }
            }
        }

        res.json({
            success: true,
            data: {
                overall: {
                    totalRecords,
                    presentRecords,
                    absentRecords,
                    lateRecords,
                    percentage: overallPercentage
                },
                classBreakdown
            }
        });
    } catch (error) {
        console.error('getAttendanceStats error:', error);
        // Return empty stats if tenant database is not set up yet
        res.json({
            success: true,
            data: {
                overall: {
                    totalRecords: 0,
                    presentRecords: 0,
                    absentRecords: 0,
                    lateRecords: 0,
                    percentage: 0
                },
                classBreakdown: []
            }
        });
    }
};

module.exports = {
    markAttendance,
    getClassAttendance,
    getStudentAttendance,
    getAttendanceReport,
    getDailyAttendance,
    getStudentMonthlyAttendance,
    getClassMonthlyAttendance,
    getDefaulters,
    submitLeaveRequest,
    updateLeaveStatus,
    getAllLeaveRequests,
    sendAttendanceNotifications,
    getAttendanceStats,
};
