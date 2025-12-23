const { getTenantPrismaClient } = require('../../utils/tenantDb');
const { PrismaClient } = require('@prisma/client');

/**
 * Create notification
 */
const createNotification = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { userId, title, message, type, link } = req.body;

        const notification = await tenantDb.notification.create({
            data: {
                userId,
                title,
                message,
                type, // INFO, SUCCESS, WARNING, ERROR
                link,
                isRead: false,
            },
        });

        // TODO: Send real-time notification via WebSocket
        // io.to(userId).emit('notification', notification);

        res.status(201).json({
            success: true,
            data: { notification },
        });
    } catch (error) {
        console.error('Create notification error:', error);
        res.status(500).json({ success: false, message: 'Failed to create notification' });
    }
};

/**
 * Get user notifications
 */
const getNotifications = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { page = 1, limit = 20, unreadOnly = false } = req.query;

        const where = { userId };
        if (unreadOnly === 'true') {
            where.isRead = false;
        }

        const [notifications, total, unreadCount] = await Promise.all([
            tenantDb.notification.findMany({
                where,
                skip: (parseInt(page) - 1) * parseInt(limit),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' },
            }),
            tenantDb.notification.count({ where }),
            tenantDb.notification.count({ where: { userId, isRead: false } }),
        ]);

        res.json({
            success: true,
            data: {
                notifications,
                unreadCount,
                pagination: {
                    total,
                    page: parseInt(page),
                    limit: parseInt(limit),
                    totalPages: Math.ceil(total / parseInt(limit)),
                },
            },
        });
    } catch (error) {
        console.error('Get notifications error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch notifications' });
    }
};

/**
 * Mark notification as read
 */
const markAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        await tenantDb.notification.update({
            where: { id },
            data: { isRead: true, readAt: new Date() },
        });

        res.json({
            success: true,
            message: 'Notification marked as read',
        });
    } catch (error) {
        console.error('Mark as read error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark as read' });
    }
};

/**
 * Mark all as read
 */
const markAllAsRead = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        await tenantDb.notification.updateMany({
            where: { userId, isRead: false },
            data: { isRead: true, readAt: new Date() },
        });

        res.json({
            success: true,
            message: 'All notifications marked as read',
        });
    } catch (error) {
        console.error('Mark all as read error:', error);
        res.status(500).json({ success: false, message: 'Failed to mark all as read' });
    }
};

/**
 * Delete notification
 */
const deleteNotification = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        await tenantDb.notification.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Notification deleted',
        });
    } catch (error) {
        console.error('Delete notification error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete notification' });
    }
};

/**
 * Get notification preferences
 */
const getPreferences = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const user = await tenantDb.user.findUnique({
            where: { id: userId },
            select: { notificationPreferences: true },
        });

        const preferences = user.notificationPreferences || {
            email: true,
            sms: false,
            push: true,
            feeReminders: true,
            attendanceAlerts: true,
            examResults: true,
            announcements: true,
        };

        res.json({
            success: true,
            data: { preferences },
        });
    } catch (error) {
        console.error('Get preferences error:', error);
        res.status(500).json({ success: false, message: 'Failed to get preferences' });
    }
};

/**
 * Update notification preferences
 */
const updatePreferences = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const preferences = req.body;

        await tenantDb.user.update({
            where: { id: userId },
            data: {
                notificationPreferences: preferences,
            },
        });

        res.json({
            success: true,
            message: 'Preferences updated successfully',
        });
    } catch (error) {
        console.error('Update preferences error:', error);
        res.status(500).json({ success: false, message: 'Failed to update preferences' });
    }
};

/**
 * Broadcast notification to all users
 */
const broadcastNotification = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { title, message, type, targetRole } = req.body;

        const where = {};
        if (targetRole) {
            where.role = targetRole;
        }

        const users = await tenantDb.user.findMany({
            where,
            select: { id: true },
        });

        const notifications = users.map(user => ({
            userId: user.id,
            title,
            message,
            type,
            isRead: false,
        }));

        await tenantDb.notification.createMany({
            data: notifications,
        });

        res.json({
            success: true,
            message: `Notification sent to ${users.length} users`,
            data: { count: users.length },
        });
    } catch (error) {
        console.error('Broadcast notification error:', error);
        res.status(500).json({ success: false, message: 'Failed to broadcast notification' });
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getPreferences,
    updatePreferences,
    broadcastNotification,
};
