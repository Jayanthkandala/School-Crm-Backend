const { getTenantPrismaClient } = require('../../utils/tenantDb');

const calculateAttendancePercentage = (present, total) => {
    if (total === 0) return 0;
    return parseFloat(((present / total) * 100).toFixed(2));
};

/**
 * Mark Staff (Teacher) Attendance
 * Can be used for bulk marking or single update
 */
const markStaffAttendance = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { date, records } = req.body;
        // records: [{ teacherId, status, remarks, checkIn, checkOut }]

        if (!date || !records || !Array.isArray(records)) {
            return res.status(400).json({ success: false, message: 'Invalid request data' });
        }

        const attendanceDate = new Date(date);

        // Process in transaction if possible, or loop
        // Prisma transaction for tenantDb
        await tenantDb.$transaction(
            records.map(record =>
                tenantDb.staffAttendance.upsert({
                    where: {
                        teacherId_date: {
                            teacherId: record.teacherId,
                            date: attendanceDate,
                        }
                    },
                    update: {
                        status: record.status,
                        remarks: record.remarks,
                        checkIn: record.checkIn ? new Date(record.checkIn) : undefined,
                        checkOut: record.checkOut ? new Date(record.checkOut) : undefined,
                        markedBy: req.user.id
                    },
                    create: {
                        teacherId: record.teacherId,
                        date: attendanceDate,
                        status: record.status,
                        remarks: record.remarks,
                        checkIn: record.checkIn ? new Date(record.checkIn) : undefined,
                        checkOut: record.checkOut ? new Date(record.checkOut) : undefined,
                        markedBy: req.user.id
                    }
                })
            )
        );

        res.json({
            success: true,
            message: 'Staff attendance marked successfully'
        });

    } catch (error) {
        console.error('Mark staff attendance error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark staff attendance' });
    }
};

/**
 * Get Staff Attendance for a specific date
 */
const getDailyStaffAttendance = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { date } = req.query;

        if (!date) {
            return res.status(400).json({ success: false, message: 'Date is required' });
        }

        const attendanceDate = new Date(date);

        // Fetch all active teachers first
        const teachers = await tenantDb.teacher.findMany({
            where: { status: 'ACTIVE' },
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        phone: true
                    }
                }
            },
            orderBy: {
                user: { fullName: 'asc' }
            }
        });

        // Fetch attendance records for the date
        const attendanceRecords = await tenantDb.staffAttendance.findMany({
            where: {
                date: attendanceDate
            }
        });

        // Map attendance to teachers
        const data = teachers.map(teacher => {
            const record = attendanceRecords.find(r => r.teacherId === teacher.id);
            return {
                teacherId: teacher.id,
                name: teacher.user.fullName,
                employeeId: teacher.employeeId,
                status: record ? record.status : 'PENDING', // Default to PENDING if not marked
                checkIn: record ? record.checkIn : null,
                checkOut: record ? record.checkOut : null,
                remarks: record ? record.remarks : '',
                details: record || null
            };
        });

        res.json({
            success: true,
            data
        });

    } catch (error) {
        console.error('Get daily staff attendance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff attendance' });
    }
};

/**
 * Get Monthly Attendance Report for a specific teacher or all
 */
const getStaffAttendanceReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { month, year, teacherId } = req.query;

        if (!month || !year) {
            return res.status(400).json({ success: false, message: 'Month and Year are required' });
        }

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const where = {
            date: {
                gte: startDate,
                lte: endDate
            }
        };

        if (teacherId) {
            where.teacherId = teacherId;
        }

        const records = await tenantDb.staffAttendance.findMany({
            where,
            include: {
                teacher: {
                    include: {
                        user: { select: { fullName: true } }
                    }
                }
            },
            orderBy: { date: 'asc' }
        });

        // Calculate stats
        const stats = {
            totalDays: endDate.getDate(),
            present: 0,
            absent: 0,
            late: 0,
            leave: 0,
            halfDay: 0
        };

        records.forEach(r => {
            if (r.status === 'PRESENT') stats.present++;
            else if (r.status === 'ABSENT') stats.absent++;
            else if (r.status === 'LATE') stats.late++;
            else if (r.status === 'LEAVE') stats.leave++;
            else if (r.status === 'HALF_DAY') stats.halfDay++;
        });

        res.json({
            success: true,
            data: {
                records,
                stats
            }
        });

    } catch (error) {
        console.error('Get staff attendance report error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch staff attendance report' });
    }
};

/**
 * Teacher Self Check-In (Optional)
 */
const selfCheckIn = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Find teacher profile for current user
        const teacher = await tenantDb.teacher.findUnique({
            where: { userId: req.user.id }
        });

        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher profile not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Check if already checked in
        const existing = await tenantDb.staffAttendance.findUnique({
            where: {
                teacherId_date: {
                    teacherId: teacher.id,
                    date: today
                }
            }
        });

        if (existing && existing.checkIn) {
            return res.status(400).json({ success: false, message: 'Already checked in today' });
        }

        await tenantDb.staffAttendance.upsert({
            where: {
                teacherId_date: {
                    teacherId: teacher.id,
                    date: today
                }
            },
            update: {
                checkIn: new Date(),
                status: 'PRESENT' // Assume present on check-in
            },
            create: {
                teacherId: teacher.id,
                date: today,
                checkIn: new Date(),
                status: 'PRESENT',
                markedBy: req.user.id
            }
        });

        res.json({ success: true, message: 'Checked in successfully' });

    } catch (error) {
        console.error('Self check-in error:', error);
        res.status(500).json({ success: false, message: 'Failed to check in' });
    }
};

/**
 * Teacher Self Check-Out
 */
const selfCheckOut = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findUnique({
            where: { userId: req.user.id }
        });

        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher profile not found' });
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const record = await tenantDb.staffAttendance.findUnique({
            where: {
                teacherId_date: {
                    teacherId: teacher.id,
                    date: today
                }
            }
        });

        if (!record || !record.checkIn) {
            return res.status(400).json({ success: false, message: 'You must check in first' });
        }

        await tenantDb.staffAttendance.update({
            where: {
                teacherId_date: {
                    teacherId: teacher.id,
                    date: today
                }
            },
            data: {
                checkOut: new Date()
            }
        });

        res.json({ success: true, message: 'Checked out successfully' });

    } catch (error) {
        console.error('Self check-out error:', error);
        res.status(500).json({ success: false, message: 'Failed to check out' });
    }
};

module.exports = {
    markStaffAttendance,
    getDailyStaffAttendance,
    getStaffAttendanceReport,
    selfCheckIn,
    selfCheckOut
};
