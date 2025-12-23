const { PrismaClient } = require('@prisma/client');
const { getTenantPrismaClient } = require('../../utils/tenantDb');
const prisma = new PrismaClient();

/**
 * Platform Owner Dashboard
 * Complete overview of all schools and system
 */
const getOwnerDashboard = async (req, res) => {
    try {
        // Platform-wide statistics
        const [
            totalSchools,
            activeSchools,
            totalRevenue,
            totalUsers,
            recentActivity,
        ] = await Promise.all([
            prisma.school.count(),
            prisma.school.count({ where: { status: 'ACTIVE' } }),
            prisma.invoice.aggregate({
                where: { status: 'PAID' },
                _sum: { total: true },
            }),
            prisma.school.findMany({
                select: {
                    id: true,
                    schoolName: true,
                },
            }).then(async (schools) => {
                let total = 0;
                for (const school of schools) {
                    try {
                        const tenantDb = getTenantPrismaClient(school.id);
                        const count = await tenantDb.user.count();
                        total += count;
                    } catch (error) {
                        console.error(`Error counting users for school ${school.id}`);
                    }
                }
                return total;
            }),
            prisma.auditLog.findMany({
                take: 20,
                orderBy: { createdAt: 'desc' },
                include: {
                    user: {
                        select: { fullName: true, email: true },
                    },
                },
            }),
        ]);

        res.json({
            success: true,
            data: {
                overview: {
                    totalSchools,
                    activeSchools,
                    suspendedSchools: totalSchools - activeSchools,
                    totalRevenue: Number(totalRevenue._sum.total) || 0,
                    totalUsers,
                },
                recentActivity,
            },
        });
    } catch (error) {
        console.error('Owner dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
    }
};

/**
 * Get all schools with detailed info
 */
const getAllSchools = async (req, res) => {
    try {
        const { page = 1, limit = 20, status, search } = req.query;

        const where = {};
        if (status) where.status = status;
        if (search) {
            where.OR = [
                { schoolName: { contains: search, mode: 'insensitive' } },
                { subdomain: { contains: search, mode: 'insensitive' } },
                { contactEmail: { contains: search, mode: 'insensitive' } },
            ];
        }

        const [schools, total] = await Promise.all([
            prisma.school.findMany({
                where,
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                include: {
                    subscription: {
                        include: { plan: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.school.count({ where }),
        ]);

        // Get user counts for each school
        const schoolsWithStats = await Promise.all(
            schools.map(async (school) => {
                try {
                    const tenantDb = getTenantPrismaClient(school.id);
                    const [students, teachers, parents] = await Promise.all([
                        tenantDb.student.count({ where: { status: 'ACTIVE' } }),
                        tenantDb.teacher.count({ where: { isActive: true } }),
                        tenantDb.parent.count(),
                    ]);

                    return {
                        ...school,
                        stats: {
                            students,
                            teachers,
                            parents,
                            totalUsers: students + teachers + parents,
                        },
                    };
                } catch (error) {
                    return {
                        ...school,
                        stats: {
                            students: 0,
                            teachers: 0,
                            parents: 0,
                            totalUsers: 0,
                        },
                    };
                }
            })
        );

        res.json({
            success: true,
            data: {
                schools: schoolsWithStats,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get all schools error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch schools' });
    }
};

/**
 * Access any school's data (impersonate)
 */
const accessSchoolData = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { module } = req.query; // students, teachers, fees, etc.

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            include: {
                subscription: {
                    include: { plan: true },
                },
            },
        });

        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        const tenantDb = getTenantPrismaClient(schoolId);

        let data = {};

        switch (module) {
            case 'students':
                data.students = await tenantDb.student.findMany({
                    include: {
                        user: true,
                        class: true,
                    },
                    take: 100,
                });
                break;

            case 'teachers':
                data.teachers = await tenantDb.teacher.findMany({
                    include: {
                        user: true,
                    },
                    take: 100,
                });
                break;

            case 'fees':
                data.fees = await tenantDb.feeInvoice.findMany({
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                        payments: true,
                    },
                    take: 100,
                });
                break;

            case 'attendance':
                data.attendance = await tenantDb.attendance.findMany({
                    include: {
                        student: {
                            include: {
                                user: true,
                            },
                        },
                    },
                    take: 100,
                    orderBy: { date: 'desc' },
                });
                break;

            case 'classes':
                data.classes = await tenantDb.class.findMany({
                    include: {
                        _count: {
                            select: { students: true },
                        },
                    },
                });
                break;

            case 'overview':
                const [students, teachers, classes, pendingFees, todayAttendance] = await Promise.all([
                    tenantDb.student.count({ where: { status: 'ACTIVE' } }),
                    tenantDb.teacher.count({ where: { isActive: true } }),
                    tenantDb.class.count(),
                    tenantDb.feeInvoice.aggregate({
                        where: { status: { in: ['PENDING', 'PARTIAL', 'OVERDUE'] } },
                        _sum: { total: true },
                    }),
                    tenantDb.attendance.count({
                        where: {
                            date: new Date(),
                            status: 'PRESENT',
                        },
                    }),
                ]);

                data.overview = {
                    students,
                    teachers,
                    classes,
                    pendingFees: Number(pendingFees._sum.total) || 0,
                    todayAttendance,
                };
                break;

            default:
                data.overview = {
                    message: 'Specify module: students, teachers, fees, attendance, classes, overview',
                };
        }

        res.json({
            success: true,
            data: {
                school: {
                    id: school.id,
                    name: school.schoolName,
                    subdomain: school.subdomain,
                    status: school.status,
                    plan: school.subscription?.plan?.planName,
                },
                ...data,
            },
        });
    } catch (error) {
        console.error('Access school data error:', error);
        res.status(500).json({ success: false, message: 'Failed to access school data' });
    }
};

/**
 * Manage school (suspend, activate, delete)
 */
const manageSchool = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { action, reason } = req.body; // suspend, activate, delete

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
        });

        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        switch (action) {
            case 'suspend':
                await prisma.school.update({
                    where: { id: schoolId },
                    data: {
                        status: 'SUSPENDED',
                        suspendedAt: new Date(),
                        suspensionReason: reason,
                    },
                });
                break;

            case 'activate':
                await prisma.school.update({
                    where: { id: schoolId },
                    data: {
                        status: 'ACTIVE',
                        suspendedAt: null,
                        suspensionReason: null,
                    },
                });
                break;

            case 'delete':
                // Delete tenant database
                if (school.databaseName) {
                    const { exec } = require('child_process');
                    const { promisify } = require('util');
                    const execAsync = promisify(exec);
                    await execAsync(`dropdb ${school.databaseName}`);
                }

                // Delete from platform
                await prisma.school.delete({ where: { id: schoolId } });
                break;

            default:
                return res.status(400).json({
                    success: false,
                    message: 'Invalid action. Use: suspend, activate, delete',
                });
        }

        // Log action
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: action.toUpperCase(),
                resource: 'SCHOOL',
                resourceId: schoolId,
                details: JSON.stringify({ schoolName: school.schoolName, reason }),
            },
        });

        res.json({
            success: true,
            message: `School ${action}d successfully`,
        });
    } catch (error) {
        console.error('Manage school error:', error);
        res.status(500).json({ success: false, message: 'Failed to manage school' });
    }
};

/**
 * View all platform invoices
 */
const getAllInvoices = async (req, res) => {
    try {
        const { status, page = 1, limit = 50 } = req.query;

        const where = status ? { status } : {};

        const [invoices, total] = await Promise.all([
            prisma.invoice.findMany({
                where,
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                include: {
                    school: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.invoice.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                invoices,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
};

/**
 * View all support tickets
 */
const getAllTickets = async (req, res) => {
    try {
        const { status, priority, page = 1, limit = 50 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                include: {
                    school: true,
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.supportTicket.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                tickets,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch tickets' });
    }
};

/**
 * Update school subscription
 */
const updateSchoolSubscription = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { planId, endDate } = req.body;

        const subscription = await prisma.subscription.findFirst({
            where: { schoolId },
        });

        if (!subscription) {
            return res.status(404).json({ success: false, message: 'Subscription not found' });
        }

        await prisma.subscription.update({
            where: { id: subscription.id },
            data: {
                planId: planId || subscription.planId,
                endDate: endDate ? new Date(endDate) : subscription.endDate,
            },
        });

        res.json({
            success: true,
            message: 'Subscription updated successfully',
        });
    } catch (error) {
        console.error('Update subscription error:', error);
        res.status(500).json({ success: false, message: 'Failed to update subscription' });
    }
};

/**
 * View platform audit logs
 */
const getAuditLogs = async (req, res) => {
    try {
        const { page = 1, limit = 100, action, resource } = req.query;

        const where = {};
        if (action) where.action = action;
        if (resource) where.resource = resource;

        const [logs, total] = await Promise.all([
            prisma.auditLog.findMany({
                where,
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                include: {
                    user: {
                        select: { fullName: true, email: true },
                    },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.auditLog.count({ where }),
        ]);

        res.json({
            success: true,
            data: {
                logs,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get audit logs error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
    }
};

/**
 * Execute custom query on any school database
 */
const executeCustomQuery = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { query } = req.body;

        // Security: Only allow SELECT queries
        if (!query.trim().toLowerCase().startsWith('select')) {
            return res.status(403).json({
                success: false,
                message: 'Only SELECT queries are allowed',
            });
        }

        const tenantDb = getTenantPrismaClient(schoolId);
        const result = await tenantDb.$queryRawUnsafe(query);

        res.json({
            success: true,
            data: { result },
        });
    } catch (error) {
        console.error('Execute query error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to execute query',
            error: error.message,
        });
    }
};

module.exports = {
    getOwnerDashboard,
    getAllSchools,
    accessSchoolData,
    manageSchool,
    getAllInvoices,
    getAllTickets,
    updateSchoolSubscription,
    getAuditLogs,
    executeCustomQuery,
};
