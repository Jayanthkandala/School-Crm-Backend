const tenantDb = require('../../utils/tenantDb');

// Hostels
exports.getAllHostels = async (req, res) => {
    try {
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);
        const hostels = await prisma.hostel.findMany({
            include: {
                _count: {
                    select: { rooms: true }
                }
            }
        });
        res.json({ success: true, data: hostels });
    } catch (error) {
        console.error('Get Hostels Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch hostels' });
    }
};

exports.createHostel = async (req, res) => {
    try {
        const { hostelName, hostelType, capacity, address, warden } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const hostel = await prisma.hostel.create({
            data: {
                hostelName,
                hostelType,
                capacity: parseInt(capacity),
                address,
                warden
            }
        });
        res.json({ success: true, data: hostel });
    } catch (error) {
        console.error('Create Hostel Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create hostel' });
    }
};

// Rooms
exports.getHostelRooms = async (req, res) => {
    try {
        const { hostelId } = req.params;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const rooms = await prisma.hostelRoom.findMany({
            where: { hostelId },
            orderBy: { roomNumber: 'asc' }
        });
        res.json({ success: true, data: rooms });
    } catch (error) {
        console.error('Get Rooms Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch rooms' });
    }
};

exports.addRoom = async (req, res) => {
    try {
        const { hostelId, roomNumber, floor, roomType, capacity } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const room = await prisma.hostelRoom.create({
            data: {
                hostelId,
                roomNumber,
                floor: parseInt(floor),
                roomType,
                capacity: parseInt(capacity)
            }
        });
        res.json({ success: true, data: room });
    } catch (error) {
        console.error('Add Room Error:', error);
        res.status(500).json({ success: false, message: 'Failed to add room' });
    }
};

// Allocations
exports.allocateRoom = async (req, res) => {
    try {
        const { roomId, studentId, allocationDate } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        // Transaction to update room occupancy and create allocation
        const result = await prisma.$transaction(async (tx) => {
            // Check room capacity
            const room = await tx.hostelRoom.findUnique({ where: { id: roomId } });
            if (room.currentOccupancy >= room.capacity) {
                throw new Error('Room is full');
            }

            // Create allocation
            const allocation = await tx.hostelAllocation.create({
                data: {
                    roomId,
                    studentId,
                    allocationDate: new Date(allocationDate)
                }
            });

            // Increment occupancy
            await tx.hostelRoom.update({
                where: { id: roomId },
                data: { currentOccupancy: { increment: 1 } }
            });

            return allocation;
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Allocate Room Error:', error);
        res.status(500).json({ success: false, message: error.message || 'Failed to allocate room' });
    }
};

exports.getStudentAllocation = async (req, res) => {
    try {
        const { studentId } = req.params;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const allocation = await prisma.hostelAllocation.findFirst({
            where: { studentId, isActive: true },
            include: {
                room: {
                    include: {
                        hostel: true
                    }
                }
            }
        });

        res.json({ success: true, data: allocation });
    } catch (error) {
        console.error('Get Student Allocation Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch allocation' });
    }
};
