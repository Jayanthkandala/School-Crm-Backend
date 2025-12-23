const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all support tickets (Platform Admin/Support view)
const getAllTickets = async (req, res) => {
    try {
        const { status, priority, assignedTo, category, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedTo) where.assignedToUserId = assignedTo;
        if (category) where.category = category;

        const [tickets, total, stats] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                include: {
                    school: { select: { schoolName: true, subdomain: true } },
                    assignedTo: { select: { fullName: true, email: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            }),
            prisma.supportTicket.count({ where }),
            prisma.supportTicket.groupBy({
                by: ['status'],
                _count: true
            })
        ]);

        const statusStats = {
            open: 0,
            inProgress: 0,
            resolved: 0,
            closed: 0
        };

        stats.forEach(stat => {
            const key = stat.status.toLowerCase().replace('_', '');
            if (key === 'inprogress') statusStats.inProgress = stat._count;
            else statusStats[key] = stat._count;
        });

        res.json({
            success: true,
            data: {
                tickets,
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                stats: statusStats
            }
        });
    } catch (error) {
        console.error('Get tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets'
        });
    }
};

// Get my assigned tickets (Support Staff)
const getMyTickets = async (req, res) => {
    try {
        const { id: userId } = req.user;

        const tickets = await prisma.supportTicket.findMany({
            where: { assignedToUserId: userId },
            include: {
                school: { select: { schoolName: true, subdomain: true } }
            },
            orderBy: [
                { priority: 'desc' },
                { createdAt: 'desc' }
            ]
        });

        res.json({
            success: true,
            data: { tickets }
        });
    } catch (error) {
        console.error('Get my tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets'
        });
    }
};

// Get ticket by ID
const getTicketById = async (req, res) => {
    try {
        const { id } = req.params;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                school: true,
                assignedTo: { select: { fullName: true, email: true } }
            }
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        res.json({
            success: true,
            data: {
                ticket,
                responses: ticket.messages || []
            }
        });
    } catch (error) {
        console.error('Get ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch ticket'
        });
    }
};

// Create support ticket (School user)
const createTicket = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { subject, description, priority, category } = req.body;

        // Generate ticket number
        const count = await prisma.supportTicket.count();
        const ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        // Get user details
        const { getTenantPrismaClient } = require('../../utils/tenantDb');
        const tenantDb = getTenantPrismaClient(tenantId);
        const user = await tenantDb.user.findUnique({
            where: { id: userId },
            select: { fullName: true, email: true }
        });

        const ticket = await prisma.supportTicket.create({
            data: {
                schoolId: tenantId,
                ticketNumber,
                subject,
                description,
                priority: priority || 'MEDIUM',
                category: category || 'GENERAL',
                status: 'OPEN',
                createdByUserId: userId,
                createdByName: user.fullName,
                createdByEmail: user.email,
                messages: []
            }
        });

        // TODO: Send notification to support team

        res.status(201).json({
            success: true,
            message: 'Support ticket created successfully',
            data: {
                ticketId: ticket.id,
                ticketNumber: ticket.ticketNumber
            }
        });
    } catch (error) {
        console.error('Create ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create ticket'
        });
    }
};

// Update ticket
const updateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { subject, description, priority, category } = req.body;

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: {
                ...(subject && { subject }),
                ...(description && { description }),
                ...(priority && { priority }),
                ...(category && { category })
            }
        });

        res.json({
            success: true,
            message: 'Ticket updated successfully',
            data: { ticket }
        });
    } catch (error) {
        console.error('Update ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update ticket'
        });
    }
};

// Assign ticket to support staff
const assignTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { assignedTo } = req.body;

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: {
                assignedToUserId: assignedTo,
                status: 'IN_PROGRESS'
            },
            include: {
                assignedTo: { select: { fullName: true, email: true } }
            }
        });

        // TODO: Send notification to assigned user

        res.json({
            success: true,
            message: 'Ticket assigned successfully',
            data: { ticket }
        });
    } catch (error) {
        console.error('Assign ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to assign ticket'
        });
    }
};

// Add response to ticket
const addResponse = async (req, res) => {
    try {
        const { id } = req.params;
        const { id: userId } = req.user;
        const { message, isInternal } = req.body;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id }
        });

        const messages = ticket.messages || [];
        messages.push({
            id: Date.now().toString(),
            userId,
            message,
            isInternal: isInternal || false,
            createdAt: new Date().toISOString()
        });

        await prisma.supportTicket.update({
            where: { id },
            data: { messages }
        });

        // TODO: Send notification to ticket creator

        res.status(201).json({
            success: true,
            message: 'Response added successfully'
        });
    } catch (error) {
        console.error('Add response error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add response'
        });
    }
};

// Change ticket status
const changeStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body; // OPEN, IN_PROGRESS, RESOLVED, CLOSED

        const updateData = { status };
        if (status === 'RESOLVED' || status === 'CLOSED') {
            updateData.resolvedAt = new Date();
        }

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: updateData
        });

        // TODO: Send notification

        res.json({
            success: true,
            message: 'Status updated successfully',
            data: { ticket }
        });
    } catch (error) {
        console.error('Change status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update status'
        });
    }
};

// Close ticket
const closeTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { resolution } = req.body;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id }
        });

        const messages = ticket.messages || [];
        if (resolution) {
            messages.push({
                id: Date.now().toString(),
                userId: req.user.id,
                message: `Resolution: ${resolution}`,
                isInternal: false,
                createdAt: new Date().toISOString()
            });
        }

        await prisma.supportTicket.update({
            where: { id },
            data: {
                status: 'CLOSED',
                resolvedAt: new Date(),
                messages
            }
        });

        // TODO: Send notification

        res.json({
            success: true,
            message: 'Ticket closed successfully'
        });
    } catch (error) {
        console.error('Close ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to close ticket'
        });
    }
};

// Get support statistics
const getStats = async (req, res) => {
    try {
        const [
            totalTickets,
            openTickets,
            byCategory,
            byPriority,
            byStatus
        ] = await Promise.all([
            prisma.supportTicket.count(),
            prisma.supportTicket.count({ where: { status: 'OPEN' } }),
            prisma.supportTicket.groupBy({
                by: ['category'],
                _count: true
            }),
            prisma.supportTicket.groupBy({
                by: ['priority'],
                _count: true
            }),
            prisma.supportTicket.groupBy({
                by: ['status'],
                _count: true
            })
        ]);

        // Calculate average response time (simplified)
        const resolvedTickets = await prisma.supportTicket.findMany({
            where: { status: { in: ['RESOLVED', 'CLOSED'] } },
            select: { createdAt: true, resolvedAt: true }
        });

        let totalResolutionTime = 0;
        resolvedTickets.forEach(ticket => {
            if (ticket.resolvedAt) {
                totalResolutionTime += ticket.resolvedAt - ticket.createdAt;
            }
        });

        const avgResolutionTime = resolvedTickets.length > 0
            ? Math.round(totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60)) // hours
            : 0;

        res.json({
            success: true,
            data: {
                totalTickets,
                openTickets,
                avgResponseTime: 2, // Placeholder - need to track first response
                avgResolutionTime,
                byCategory: byCategory.map(c => ({ category: c.category, count: c._count })),
                byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
                byStatus: byStatus.map(s => ({ status: s.status, count: s._count }))
            }
        });
    } catch (error) {
        console.error('Get stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch statistics'
        });
    }
};

module.exports = {
    getAllTickets,
    getMyTickets,
    getTicketById,
    createTicket,
    updateTicket,
    assignTicket,
    addResponse,
    changeStatus,
    closeTicket,
    getStats,
};
