const { getTenantPrismaClient } = require('../../utils/tenantDb');

// Messages
const sendMessage = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { recipientId, subject, message } = req.body;

        const msg = await tenantDb.message.create({
            data: {
                senderId: userId,
                recipientId,
                subject,
                message,
            },
        });

        res.status(201).json({ success: true, data: { message: msg } });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

const getMessages = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const messages = await tenantDb.message.findMany({
            where: { recipientId: userId },
            include: {
                sender: {
                    select: { fullName: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { messages } });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};

const sendBulkMessage = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { recipientIds, subject, message } = req.body;

        const messages = await Promise.all(
            recipientIds.map(recipientId =>
                tenantDb.message.create({
                    data: {
                        senderId: userId,
                        recipientId,
                        subject,
                        message,
                    },
                })
            )
        );

        res.status(201).json({
            success: true,
            data: { messages, count: messages.length },
            message: `Sent ${messages.length} messages successfully`
        });
    } catch (error) {
        console.error('Send bulk message error:', error);
        res.status(500).json({ success: false, message: 'Failed to send bulk messages' });
    }
};

// Announcements
const createAnnouncement = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { title, content, targetAudience, priority, publishDate, expiryDate } = req.body;

        const announcement = await tenantDb.announcement.create({
            data: {
                title,
                content,
                targetAudience: targetAudience || 'ALL',
                priority: priority || 'NORMAL',
                publishDate: publishDate ? new Date(publishDate) : new Date(),
                expiryDate: expiryDate ? new Date(expiryDate) : null,
            },
        });

        res.status(201).json({ success: true, data: { announcement } });
    } catch (error) {
        console.error('Create announcement error:', error);
        res.status(500).json({ success: false, message: 'Failed to create announcement' });
    }
};

const getAnnouncements = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const announcements = await tenantDb.announcement.findMany({
            where: {
                publishDate: { lte: new Date() },
                OR: [
                    { expiryDate: null },
                    { expiryDate: { gte: new Date() } },
                ],
            },
            orderBy: { publishDate: 'desc' },
        });

        res.json({ success: true, data: { announcements } });
    } catch (error) {
        console.error('Get announcements error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
    }
};

const getAllAnnouncements = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const announcements = await tenantDb.announcement.findMany({
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { announcements, count: announcements.length } });
    } catch (error) {
        console.error('getAllAnnouncements error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch announcements' });
    }
};

const updateAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { title, content, targetAudience, priority, publishDate, expiryDate } = req.body;

        const announcement = await tenantDb.announcement.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(content && { content }),
                ...(targetAudience && { targetAudience }),
                ...(priority && { priority }),
                ...(publishDate && { publishDate: new Date(publishDate) }),
                ...(expiryDate !== undefined && { expiryDate: expiryDate ? new Date(expiryDate) : null }),
            },
        });

        res.json({ success: true, data: { announcement } });
    } catch (error) {
        console.error('Update announcement error:', error);
        res.status(500).json({ success: false, message: 'Failed to update announcement' });
    }
};

const deleteAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        await tenantDb.announcement.delete({ where: { id } });

        res.json({ success: true, message: 'Announcement deleted successfully' });
    } catch (error) {
        console.error('Delete announcement error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete announcement' });
    }
};

const publishAnnouncement = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const announcement = await tenantDb.announcement.update({
            where: { id },
            data: {
                publishDate: new Date(),
            },
        });

        res.json({ success: true, data: { announcement }, message: 'Announcement published successfully' });
    } catch (error) {
        console.error('Publish announcement error:', error);
        res.status(500).json({ success: false, message: 'Failed to publish announcement' });
    }
};

// Events (Note: You may need to add Event model to tenant schema)
// Events
const getAllEvents = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const events = await tenantDb.event.findMany({
            orderBy: { eventDate: 'asc' }
        });

        res.json({ success: true, data: { events, count: events.length } });
    } catch (error) {
        console.error('getAllEvents error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
};

const createEvent = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { title, description, eventDate, location } = req.body;

        const event = await tenantDb.event.create({
            data: {
                title,
                description,
                eventDate: new Date(eventDate),
                location
            }
        });

        res.status(201).json({
            success: true,
            message: 'Event created successfully',
            data: { event }
        });
    } catch (error) {
        console.error('createEvent error:', error);
        res.status(500).json({ success: false, message: 'Failed to create event' });
    }
};

module.exports = {
    sendMessage,
    getMessages,
    sendBulkMessage,
    createAnnouncement,
    getAnnouncements,
    getAllAnnouncements,
    updateAnnouncement,
    deleteAnnouncement,
    publishAnnouncement,
    getAllEvents,
    createEvent,
};
