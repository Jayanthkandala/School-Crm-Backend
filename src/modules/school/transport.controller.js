const { getTenantPrismaClient } = require('../../utils/tenantDb');

const getAllRoutes = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { limit = 50, offset = 0 } = req.query;

        const [routes, total] = await Promise.all([
            tenantDb.transportRoute.findMany({
                include: {
                    _count: {
                        select: { students: true },
                    },
                },
                orderBy: { routeNumber: 'asc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            }),
            tenantDb.transportRoute.count()
        ]);

        res.json({
            success: true,
            data: {
                routes,
                pagination: {
                    total,
                    count: routes.length,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            }
        });
    } catch (error) {
        console.error('Get routes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch routes' });
    }
};

const getRouteById = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const route = await tenantDb.transportRoute.findUnique({
            where: { id },
            include: {
                students: {
                    include: {
                        student: {
                            include: {
                                user: { select: { fullName: true } },
                                class: { select: { className: true, section: true } }
                            }
                        }
                    }
                },
                _count: {
                    select: { students: true }
                }
            }
        });

        if (!route) {
            return res.status(404).json({ success: false, message: 'Route not found' });
        }

        res.json({ success: true, data: { route } });
    } catch (error) {
        console.error('Get route error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch route' });
    }
};

const createRoute = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { routeName, routeNumber, vehicleNumber, driverName, driverPhone, capacity, fee } = req.body;

        // Check if route number already exists
        const existing = await tenantDb.transportRoute.findFirst({
            where: { routeNumber },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Route number already exists'
            });
        }

        const route = await tenantDb.transportRoute.create({
            data: {
                routeName,
                routeNumber,
                vehicleNumber,
                driverName,
                driverPhone,
                capacity: parseInt(capacity),
                fee: parseFloat(fee),
            },
        });

        res.status(201).json({ success: true, data: { route } });
    } catch (error) {
        console.error('Create route error:', error);
        res.status(500).json({ success: false, message: 'Failed to create route' });
    }
};

const updateRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { routeName, routeNumber, vehicleNumber, driverName, driverPhone, capacity, fee } = req.body;

        const route = await tenantDb.transportRoute.update({
            where: { id },
            data: {
                ...(routeName && { routeName }),
                ...(routeNumber && { routeNumber }),
                ...(vehicleNumber && { vehicleNumber }),
                ...(driverName && { driverName }),
                ...(driverPhone && { driverPhone }),
                ...(capacity && { capacity: parseInt(capacity) }),
                ...(fee !== undefined && { fee: parseFloat(fee) }),
            },
        });

        res.json({ success: true, data: { route } });
    } catch (error) {
        console.error('Update route error:', error);
        res.status(500).json({ success: false, message: 'Failed to update route' });
    }
};

const deleteRoute = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Check if route has students
        const studentsCount = await tenantDb.transportStudent.count({
            where: { routeId: id },
        });

        if (studentsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete route with ${studentsCount} students. Please reassign students first.`
            });
        }

        await tenantDb.transportRoute.delete({ where: { id } });

        res.json({ success: true, message: 'Route deleted successfully' });
    } catch (error) {
        console.error('Delete route error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete route' });
    }
};

const assignStudentToRoute = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { studentId, routeId, pickupPoint, dropPoint } = req.body;

        // Check if student is already assigned to a route
        const existing = await tenantDb.transportStudent.findFirst({
            where: { studentId },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Student is already assigned to a route. Please remove first.'
            });
        }

        // Check route capacity
        const route = await tenantDb.transportRoute.findUnique({
            where: { id: routeId },
            include: {
                _count: {
                    select: { students: true },
                },
            },
        });

        if (route._count.students >= route.capacity) {
            return res.status(400).json({
                success: false,
                message: `Route is at full capacity (${route.capacity} students)`
            });
        }

        const assignment = await tenantDb.transportStudent.create({
            data: {
                studentId,
                routeId,
                pickupPoint,
                dropPoint,
            },
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true } },
                        class: { select: { className: true, section: true } },
                    },
                },
                route: true,
            },
        });

        res.status(201).json({ success: true, data: { assignment } });
    } catch (error) {
        console.error('Assign student error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign student' });
    }
};

const getRouteStudents = async (req, res) => {
    try {
        const { routeId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const students = await tenantDb.transportStudent.findMany({
            where: { routeId },
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true, phone: true } },
                        class: { select: { className: true, section: true } },
                    },
                },
            },
        });

        res.json({ success: true, data: { students, count: students.length } });
    } catch (error) {
        console.error('Get route students error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch route students' });
    }
};

const getTransportStats = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const [totalRoutes, totalStudents, routesWithCapacity] = await Promise.all([
            tenantDb.transportRoute.count(),
            tenantDb.transportStudent.count(),
            tenantDb.transportRoute.findMany({
                include: {
                    _count: {
                        select: { students: true },
                    },
                },
            }),
        ]);

        const totalCapacity = routesWithCapacity.reduce((sum, route) => sum + route.capacity, 0);
        const utilizationRate = totalCapacity > 0 ? (totalStudents / totalCapacity) * 100 : 0;

        res.json({
            success: true,
            data: {
                totalRoutes,
                totalStudents,
                totalCapacity,
                utilizationRate: utilizationRate.toFixed(2),
                routes: routesWithCapacity.map(route => ({
                    routeName: route.routeName,
                    capacity: route.capacity,
                    occupied: route._count.students,
                    available: route.capacity - route._count.students,
                })),
            }
        });
    } catch (error) {
        console.error('Get transport stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch transport stats' });
    }
};

module.exports = {
    getAllRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    deleteRoute,
    assignStudentToRoute,
    getRouteStudents,
    getTransportStats,
};
