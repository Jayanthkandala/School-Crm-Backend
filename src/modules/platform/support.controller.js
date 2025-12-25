const { PrismaClient } = require('.prisma/client-platform');
const prisma = new PrismaClient();
const emailService = require('../../services/email.service');


// Get all support tickets (Platform Admin/Support view)
const getAllTickets = async (req, res) => {
    try {
        const { status, priority, assignedTo, startDate, endDate, page = 1, limit = 20 } = req.query;

        const where = {};
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (assignedTo) where.assignedToUserId = assignedTo;

        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate) where.createdAt.gte = new Date(startDate);
            if (endDate) where.createdAt.lte = new Date(endDate);
        }

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
                school: {
                    include: {
                        subscriptionPlan: true,
                        subscriptions: {
                            where: { status: 'ACTIVE' },
                            orderBy: { createdAt: 'desc' },
                            take: 1
                        }
                    }
                },
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

// Get tickets for a specific school (Tenant view)
const getSchoolTickets = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { status, page = 1, limit = 20 } = req.query;

        const where = { schoolId: tenantId };
        if (status) where.status = status;

        const [tickets, total] = await Promise.all([
            prisma.supportTicket.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            }),
            prisma.supportTicket.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                tickets,
                total,
                page: parseInt(page),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        console.error('Get school tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch tickets'
        });
    }
};

// Get school ticket by ID (security check against tenantId)
const getSchoolTicketById = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id },
            include: {
                messages: true
            }
        });

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        if (ticket.schoolId !== tenantId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

        res.json({
            success: true,
            data: { ticket }
        });
    } catch (error) {
        console.error('Get school ticket details error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch ticket' });
    }
};

// Create support ticket (School user)
const createTicket = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { subject, description, priority } = req.body;

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
                category: req.body.category || 'GENERAL',
                status: 'OPEN',
                createdByUserId: userId,
                createdByName: user.fullName,
                createdByEmail: user.email,
                messages: []
            }
        });

        // Send notification to school user
        try {
            const school = await prisma.school.findUnique({
                where: { id: tenantId },
                select: { schoolName: true }
            });

            // Fetch Auto Responder Settings
            const settings = await prisma.systemSetting.findMany({
                where: { settingKey: { in: ['SUPPORT_AUTO_RESPONDER_ENABLED', 'SUPPORT_AUTO_RESPONDER_TEXT'] } }
            });
            const config = {};
            settings.forEach(s => config[s.settingKey] = s.settingValue);

            const customMessage = config.SUPPORT_AUTO_RESPONDER_ENABLED === 'true' ? config.SUPPORT_AUTO_RESPONDER_TEXT : null;

            await emailService.sendEmail({
                to: user.email,
                subject: `Support Ticket Created: ${ticketNumber}`,
                template: 'supportTicketCreatedEmail',
                data: {
                    ticketNumber,
                    subject,
                    category: req.body.category || 'GENERAL',
                    priority: priority || 'MEDIUM',
                    schoolName: school?.schoolName || 'School CRM',
                    customMessage
                }
            });
        } catch (emailError) {
            console.error('Failed to send ticket creation email:', emailError);
        }

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

// Create support ticket (Platform user - for testing)
const createPlatformTicket = async (req, res) => {
    try {
        const { id: userId, email, fullName } = req.user;
        const { subject, description, priority, schoolId } = req.body;

        if (!schoolId) {
            return res.status(400).json({
                success: false,
                message: 'School ID is required'
            });
        }

        // Verify school exists
        const school = await prisma.school.findUnique({
            where: { id: schoolId }
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'School not found'
            });
        }

        // Generate ticket number
        const count = await prisma.supportTicket.count();
        const ticketNumber = `TKT-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        const ticket = await prisma.supportTicket.create({
            data: {
                schoolId,
                ticketNumber,
                subject,
                description,
                priority: priority || 'MEDIUM',
                category: req.body.category || 'GENERAL',
                status: 'OPEN',
                createdByUserId: userId,
                createdByName: fullName || 'Platform User',
                createdByEmail: email,
                messages: []
            }
        });

        // Send notification to creator (Platform Ticket)
        try {
            let schoolName = 'Platform Support';
            if (schoolId) {
                const school = await prisma.school.findUnique({ where: { id: schoolId } });
                schoolName = school?.schoolName || schoolName;
            }

            await emailService.sendEmail({
                to: email,
                subject: `Support Ticket Created: ${ticketNumber}`,
                template: 'supportTicketCreatedEmail',
                data: {
                    ticketNumber,
                    ticketId: ticket.id,
                    subject,
                    category: req.body.category || 'GENERAL',
                    priority: priority || 'MEDIUM',
                    schoolName
                }
            });
        } catch (emailError) {
            console.error('Failed to send platform ticket email:', emailError);
        }

        res.status(201).json({
            success: true,
            message: 'Support ticket created successfully',
            data: {
                ticketId: ticket.id,
                ticketNumber: ticket.ticketNumber
            }
        });
    } catch (error) {
        console.error('Create platform ticket error:', error);
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

        // Send notification to assigned user
        if (ticket.assignedTo && ticket.assignedTo.email) {
            try {
                await emailService.sendEmail({
                    to: ticket.assignedTo.email,
                    subject: `Ticket Assigned: ${ticket.ticketNumber}`,
                    template: 'supportTicketAssignedEmail',
                    data: {
                        ticketNumber: ticket.ticketNumber,
                        subject: ticket.subject,
                        assignedTo: ticket.assignedTo.fullName
                    }
                });
            } catch (emailError) {
                console.error('Failed to send assignment email:', emailError);
            }
        }

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

        if (!ticket) {
            return res.status(404).json({ success: false, message: 'Ticket not found' });
        }

        // Security check for Tenant/School Users
        if (req.user.tenantId && ticket.schoolId !== req.user.tenantId) {
            return res.status(403).json({ success: false, message: 'Access denied' });
        }

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

        // Send notification to ticket creator (if the responder is NOT the creator)
        if (ticket.createdByUserId !== userId && !isInternal) {
            try {
                await emailService.sendEmail({
                    to: ticket.createdByEmail,
                    subject: `New Response: ${ticket.ticketNumber}`,
                    template: 'supportTicketResponseEmail',
                    data: {
                        ticketNumber: ticket.ticketNumber,
                        subject: ticket.subject,
                        responderName: req.user.fullName || 'Support Team',
                        message
                    }
                });
            } catch (emailError) {
                console.error('Failed to send response email:', emailError);
            }
        }

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

        // Send notification
        if (ticket.createdByEmail) {
            try {
                await emailService.sendEmail({
                    to: ticket.createdByEmail,
                    subject: `Ticket Status Updated: ${ticket.ticketNumber}`,
                    template: 'supportTicketStatusChangeEmail',
                    data: {
                        ticketNumber: ticket.ticketNumber,
                        subject: ticket.subject,
                        status,
                        updatedBy: req.user.fullName || 'Support Team'
                    }
                });
            } catch (emailError) {
                console.error('Failed to send status update email:', emailError);
            }
        }

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

        // Send notification
        if (ticket.createdByEmail) {
            try {
                await emailService.sendEmail({
                    to: ticket.createdByEmail,
                    subject: `Ticket Closed: ${ticket.ticketNumber}`,
                    template: 'supportTicketClosedEmail',
                    data: {
                        ticketNumber: ticket.ticketNumber,
                        subject: ticket.subject,
                        closedBy: req.user.fullName || 'Support Team',
                        resolution: resolution || 'No resolution notes provided.'
                    }
                });
            } catch (emailError) {
                console.error('Failed to send close email:', emailError);
            }
        }

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

const deleteTicket = async (req, res) => {
    try {
        const { id } = req.params;
        await prisma.supportTicket.delete({ where: { id } });
        res.json({ success: true, message: 'Ticket deleted successfully' });
    } catch (error) {
        console.error('Delete ticket error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete ticket' });
    }
};

// Get support statistics
const getStats = async (req, res) => {
    try {
        const [
            totalTickets,
            openTickets,
            inProgressTickets,
            resolvedTickets,
            closedTickets,
            byPriority,
            byStatus,
            recentTickets,
            oldestTickets
        ] = await Promise.all([
            prisma.supportTicket.count().then(c => {
                console.log(` DEBUG: Total Tickets in DB: ${c}`);
                return c;
            }),
            prisma.supportTicket.count({ where: { status: 'OPEN' } }),
            prisma.supportTicket.count({ where: { status: 'IN_PROGRESS' } }),
            prisma.supportTicket.count({ where: { status: 'RESOLVED' } }),
            prisma.supportTicket.count({ where: { status: 'CLOSED' } }),
            prisma.supportTicket.groupBy({
                by: ['priority'],
                _count: true
            }),
            prisma.supportTicket.groupBy({
                by: ['status'],
                _count: true
            }),
            prisma.supportTicket.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: {
                    school: { select: { schoolName: true } },
                    assignedTo: { select: { fullName: true } }
                }
            }),
            prisma.supportTicket.findMany({
                where: { status: { in: ['OPEN', 'IN_PROGRESS'] } },
                take: 5,
                orderBy: { createdAt: 'asc' },
                include: {
                    school: { select: { schoolName: true } },
                    assignedTo: { select: { fullName: true } }
                }
            })
        ]);

        // Calculate average response time (simplified)
        const resolvedTicketsList = await prisma.supportTicket.findMany({
            where: { status: { in: ['RESOLVED', 'CLOSED'] } },
            select: { createdAt: true, resolvedAt: true }
        });

        let totalResolutionTime = 0;
        resolvedTicketsList.forEach(ticket => {
            if (ticket.resolvedAt) {
                totalResolutionTime += ticket.resolvedAt - ticket.createdAt;
            }
        });

        const avgResolutionTime = resolvedTicketsList.length > 0
            ? Math.round(totalResolutionTime / resolvedTicketsList.length / (1000 * 60 * 60)) // hours
            : 0;

        res.json({
            success: true,
            data: {
                totalTickets,
                openTickets,
                inProgressTickets,
                resolvedTickets,
                closedTickets,
                avgResponseTime: 2, // Placeholder
                avgResolutionTime,
                byPriority: byPriority.map(p => ({ priority: p.priority, count: p._count })),
                byStatus: byStatus.map(s => ({ status: s.status, count: s._count })),
                recentTickets,
                oldestTickets
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

// ============================================
// ENHANCED TICKET FEATURES
// ============================================

// Escalate ticket
const escalateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { escalatedTo, reason } = req.body;

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: {
                escalated: true,
                escalatedAt: new Date(),
                escalatedTo,
                internalNotes: {
                    push: {
                        userId: req.user.id,
                        userName: req.user.fullName,
                        note: `Ticket escalated to ${escalatedTo}. Reason: ${reason}`,
                        createdAt: new Date()
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Ticket escalated successfully',
            data: { ticket }
        });
    } catch (error) {
        console.error('Escalate ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to escalate ticket'
        });
    }
};

// Add internal note
const addInternalNote = async (req, res) => {
    try {
        const { id } = req.params;
        const { note } = req.body;

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: {
                internalNotes: {
                    push: {
                        userId: req.user.id,
                        userName: req.user.fullName,
                        note,
                        createdAt: new Date()
                    }
                }
            }
        });

        res.json({
            success: true,
            message: 'Internal note added',
            data: { ticket }
        });
    } catch (error) {
        console.error('Add internal note error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to add internal note'
        });
    }
};

// Rate ticket satisfaction
const rateTicket = async (req, res) => {
    try {
        const { id } = req.params;
        const { rating, comment } = req.body;

        if (rating < 1 || rating > 5) {
            return res.status(400).json({
                success: false,
                message: 'Rating must be between 1 and 5'
            });
        }

        const ticket = await prisma.supportTicket.update({
            where: { id },
            data: {
                satisfactionRating: rating,
                satisfactionComment: comment
            }
        });

        res.json({
            success: true,
            message: 'Thank you for your feedback',
            data: { ticket }
        });
    } catch (error) {
        console.error('Rate ticket error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit rating'
        });
    }
};

// Advanced search
const searchTickets = async (req, res) => {
    try {
        const {
            query,
            status,
            priority,
            category,
            dateFrom,
            dateTo,
            assignedTo,
            schoolId,
            tags,
            page = 1,
            limit = 20
        } = req.query;

        const where = {};

        // Text search
        if (query) {
            where.OR = [
                { subject: { contains: query, mode: 'insensitive' } },
                { description: { contains: query, mode: 'insensitive' } },
                { ticketNumber: { contains: query, mode: 'insensitive' } }
            ];
        }

        // Filters
        if (status) where.status = status;
        if (priority) where.priority = priority;
        if (category) where.category = category;
        if (assignedTo) where.assignedToUserId = assignedTo;
        if (schoolId) where.schoolId = schoolId;

        // Date range
        if (dateFrom || dateTo) {
            where.createdAt = {};
            if (dateFrom) where.createdAt.gte = new Date(dateFrom);
            if (dateTo) where.createdAt.lte = new Date(dateTo);
        }

        const [tickets, total] = await Promise.all([
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
            prisma.supportTicket.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                tickets,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Search tickets error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to search tickets'
        });
    }
};

// ============================================
// KNOWLEDGE BASE
// ============================================

// Get all KB articles
const getAllArticles = async (req, res) => {
    try {
        const { category, search, published, page = 1, limit = 20 } = req.query;

        const where = {};
        if (category) where.category = category;
        if (published !== undefined) where.published = published === 'true';
        if (search) {
            where.OR = [
                { title: { contains: search, mode: 'insensitive' } },
                { content: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [articles, total] = await Promise.all([
            prisma.knowledgeBaseArticle.findMany({
                where,
                include: {
                    author: { select: { fullName: true } }
                },
                orderBy: { createdAt: 'desc' },
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit)
            }),
            prisma.knowledgeBaseArticle.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                articles,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit))
                }
            }
        });
    } catch (error) {
        console.error('Get articles error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch articles'
        });
    }
};

// Get article by ID
const getArticleById = async (req, res) => {
    try {
        const { id } = req.params;

        const article = await prisma.knowledgeBaseArticle.update({
            where: { id },
            data: { views: { increment: 1 } },
            include: {
                author: { select: { fullName: true, email: true } }
            }
        });

        res.json({
            success: true,
            data: { article }
        });
    } catch (error) {
        console.error('Get article error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch article'
        });
    }
};

// Create KB article
const createArticle = async (req, res) => {
    try {
        const { title, content, category, tags, published } = req.body;

        const article = await prisma.knowledgeBaseArticle.create({
            data: {
                title,
                content,
                category,
                tags: tags || [],
                published: published || false,
                authorId: req.user.id
            }
        });

        res.status(201).json({
            success: true,
            message: 'Article created successfully',
            data: { article }
        });
    } catch (error) {
        console.error('Create article error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create article'
        });
    }
};

// Update KB article
const updateArticle = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const article = await prisma.knowledgeBaseArticle.update({
            where: { id },
            data: updateData
        });

        res.json({
            success: true,
            message: 'Article updated successfully',
            data: { article }
        });
    } catch (error) {
        console.error('Update article error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update article'
        });
    }
};

// Delete KB article
const deleteArticle = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.knowledgeBaseArticle.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Article deleted successfully'
        });
    } catch (error) {
        console.error('Delete article error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete article'
        });
    }
};

// Mark article as helpful
const markArticleHelpful = async (req, res) => {
    try {
        const { id } = req.params;
        const { helpful } = req.body;

        const article = await prisma.knowledgeBaseArticle.update({
            where: { id },
            data: helpful ? { helpful: { increment: 1 } } : { notHelpful: { increment: 1 } }
        });

        res.json({
            success: true,
            message: 'Thank you for your feedback',
            data: { article }
        });
    } catch (error) {
        console.error('Mark helpful error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to submit feedback'
        });
    }
};

// ============================================
// TICKET TEMPLATES
// ============================================

// Get all templates
const getAllTemplates = async (req, res) => {
    try {
        const { category } = req.query;

        const where = {};
        if (category) where.category = category;

        const templates = await prisma.ticketTemplate.findMany({
            where,
            include: {
                creator: { select: { fullName: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: { templates }
        });
    } catch (error) {
        console.error('Get templates error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch templates'
        });
    }
};

// Create template
const createTemplate = async (req, res) => {
    try {
        const { name, subject, content, category, tags } = req.body;

        const template = await prisma.ticketTemplate.create({
            data: {
                name,
                subject,
                content,
                category,
                tags: tags || [],
                createdBy: req.user.id
            }
        });

        res.status(201).json({
            success: true,
            message: 'Template created successfully',
            data: { template }
        });
    } catch (error) {
        console.error('Create template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create template'
        });
    }
};

// Update template
const updateTemplate = async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        const template = await prisma.ticketTemplate.update({
            where: { id },
            data: updateData
        });

        res.json({
            success: true,
            message: 'Template updated successfully',
            data: { template }
        });
    } catch (error) {
        console.error('Update template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update template'
        });
    }
};

// Delete template
const deleteTemplate = async (req, res) => {
    try {
        const { id } = req.params;

        await prisma.ticketTemplate.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Template deleted successfully'
        });
    } catch (error) {
        console.error('Delete template error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete template'
        });
    }
};

// ============================================
// SLA MANAGEMENT
// ============================================

// Get all SLA policies
const getAllSLAPolicies = async (req, res) => {
    try {
        const policies = await prisma.sLAPolicy.findMany({
            orderBy: { priority: 'asc' }
        });

        res.json({
            success: true,
            data: { policies }
        });
    } catch (error) {
        console.error('Get SLA policies error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch SLA policies'
        });
    }
};

// Create SLA policy
const createSLAPolicy = async (req, res) => {
    try {
        const { name, description, priority, firstResponseTime, resolutionTime, businessHoursOnly } = req.body;

        const policy = await prisma.sLAPolicy.create({
            data: {
                name,
                description,
                priority,
                firstResponseTime,
                resolutionTime,
                businessHoursOnly: businessHoursOnly || false
            }
        });

        res.status(201).json({
            success: true,
            message: 'SLA policy created successfully',
            data: { policy }
        });
    } catch (error) {
        console.error('Create SLA policy error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to create SLA policy'
        });
    }
};

// Check SLA status for ticket
const checkSLAStatus = async (req, res) => {
    try {
        const { ticketId } = req.params;

        const ticket = await prisma.supportTicket.findUnique({
            where: { id: ticketId }
        });

        if (!ticket) {
            return res.status(404).json({
                success: false,
                message: 'Ticket not found'
            });
        }

        const now = new Date();
        const createdAt = new Date(ticket.createdAt);
        const minutesElapsed = Math.floor((now - createdAt) / (1000 * 60));

        const slaStatus = {
            ticketId: ticket.id,
            priority: ticket.priority,
            createdAt: ticket.createdAt,
            minutesElapsed,
            firstResponseSLA: ticket.firstResponseSLA,
            resolutionSLA: ticket.resolutionSLA,
            firstResponseMet: ticket.firstResponseAt ? true : false,
            firstResponseBreached: ticket.firstResponseSLA && !ticket.firstResponseAt && minutesElapsed > ticket.firstResponseSLA,
            resolutionBreached: ticket.slaBreached,
            status: ticket.status
        };

        res.json({
            success: true,
            data: slaStatus
        });
    } catch (error) {
        console.error('Check SLA status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to check SLA status'
        });
    }
};

// ============================================
// SETTINGS (Support Specific)
// ============================================

const getSupportSettings = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                settingKey: { startsWith: 'SUPPORT_' }
            }
        });
        const settingsMap = {};
        settings.forEach(s => settingsMap[s.settingKey] = s.settingValue);

        res.json({ success: true, data: { settings: settingsMap } });
    } catch (error) {
        console.error('getSupportSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
};

const updateSupportSettings = async (req, res) => {
    try {
        const { settings } = req.body;
        const updates = [];

        for (const [key, value] of Object.entries(settings)) {
            if (!key.startsWith('SUPPORT_')) continue;

            updates.push(prisma.systemSetting.upsert({
                where: { settingKey: key },
                update: { settingValue: String(value), updatedBy: req.user.id },
                create: { settingKey: key, settingValue: String(value), category: 'support', updatedBy: req.user.id }
            }));
        }
        await prisma.$transaction(updates);
        res.json({ success: true, message: 'Settings updated' });
    } catch (error) {
        console.error('updateSupportSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
};

module.exports = {
    getAllTickets,
    getMyTickets,
    getTicketById,
    createTicket,
    createPlatformTicket,
    updateTicket,
    assignTicket,
    addResponse,
    changeStatus,
    closeTicket,
    getStats,
    deleteTicket,
    // Enhanced features
    escalateTicket,
    addInternalNote,
    getSchoolTickets,
    getSchoolTicketById,
    rateTicket,
    searchTickets,
    // Knowledge Base
    getAllArticles,
    getArticleById,
    createArticle,
    updateArticle,
    deleteArticle,
    markArticleHelpful,
    // Templates
    getAllTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    // SLA
    getAllSLAPolicies,
    createSLAPolicy,
    checkSLAStatus,
    // Settings
    getSupportSettings,
    updateSupportSettings
};
