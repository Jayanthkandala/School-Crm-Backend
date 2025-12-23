const { getTenantPrismaClient } = require('../../utils/tenantDb');
const bcrypt = require('bcryptjs');
const { generateRandomPassword } = require('../../utils/generators');

const getAllUsers = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { role, limit = 50, offset = 0, search } = req.query;

        const where = {};
        if (role) where.role = role;
        if (search) {
            where.OR = [
                { fullName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [users, total] = await Promise.all([
            tenantDb.user.findMany({
                where,
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    phone: true,
                    role: true,
                    isActive: true,
                    gender: true,
                    dateOfBirth: true,
                    profilePhoto: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
                orderBy: { createdAt: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset),
            }),
            tenantDb.user.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                users,
                pagination: {
                    total,
                    count: users.length,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            }
        });
    } catch (error) {
        console.error('getAllUsers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch users' });
    }
};

const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const user = await tenantDb.user.findUnique({
            where: { id },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                createdAt: true,
                updatedAt: true,
            },
        });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.json({ success: true, data: { user } });
    } catch (error) {
        console.error('getUserById error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user' });
    }
};

const createUser = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { fullName, email, phone, role, gender, dateOfBirth, profilePhoto } = req.body;

        // Check if email already exists
        const existing = await tenantDb.user.findFirst({ where: { email } });
        if (existing) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await tenantDb.user.create({
            data: {
                fullName,
                email,
                phone,
                role,
                passwordHash: hashedPassword,
                gender: gender || null,
                dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
                profilePhoto: profilePhoto || null,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                gender: true,
                dateOfBirth: true,
                profilePhoto: true,
            },
        });

        res.status(201).json({
            success: true,
            data: { user, password },
            message: 'User created successfully',
        });
    } catch (error) {
        console.error('createUser error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
};

const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { fullName, email, phone, role, gender, dateOfBirth, profilePhoto } = req.body;

        const user = await tenantDb.user.update({
            where: { id },
            data: {
                ...(fullName && { fullName }),
                ...(email && { email }),
                ...(phone !== undefined && { phone }),
                ...(role && { role }),
                ...(gender !== undefined && { gender }),
                ...(dateOfBirth !== undefined && { dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null }),
                ...(profilePhoto !== undefined && { profilePhoto }),
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                phone: true,
                role: true,
                isActive: true,
                gender: true,
                dateOfBirth: true,
                profilePhoto: true,
            },
        });

        res.json({ success: true, data: { user } });
    } catch (error) {
        console.error('updateUser error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
};

const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        await tenantDb.user.delete({ where: { id } });

        res.json({ success: true, message: 'User deleted successfully' });
    } catch (error) {
        console.error('deleteUser error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};

const updateUserStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { isActive } = req.body;

        const user = await tenantDb.user.update({
            where: { id },
            data: { isActive },
            select: {
                id: true,
                fullName: true,
                email: true,
                isActive: true,
            },
        });

        res.json({ success: true, data: { user } });
    } catch (error) {
        console.error('updateUserStatus error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user status' });
    }
};

const resetPassword = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        await tenantDb.user.update({
            where: { id },
            data: { passwordHash: hashedPassword },
        });

        res.json({
            success: true,
            data: { password },
            message: 'Password reset successfully',
        });
    } catch (error) {
        console.error('resetPassword error:', error);
        res.status(500).json({ success: false, message: 'Failed to reset password' });
    }
};

const bulkImportUsers = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { users } = req.body;

        if (!Array.isArray(users) || users.length === 0) {
            return res.status(400).json({ success: false, message: 'Users must be a non-empty array' });
        }

        const createdUsers = [];
        for (const userData of users) {
            const password = generateRandomPassword();
            const hashedPassword = await bcrypt.hash(password, 10);

            const user = await tenantDb.user.create({
                data: {
                    ...userData,
                    passwordHash: hashedPassword,
                },
            });

            createdUsers.push({ ...user, password });
        }

        res.status(201).json({
            success: true,
            data: { users: createdUsers, count: createdUsers.length },
            message: `Imported ${createdUsers.length} users successfully`,
        });
    } catch (error) {
        console.error('bulkImportUsers error:', error);
        res.status(500).json({ success: false, message: 'Failed to import users' });
    }
};

const getUserStats = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const [total, active, byRole] = await Promise.all([
            tenantDb.user.count(),
            tenantDb.user.count({ where: { isActive: true } }),
            tenantDb.user.groupBy({
                by: ['role'],
                _count: true,
            }),
        ]);

        res.json({
            success: true,
            data: {
                total,
                active,
                inactive: total - active,
                byRole: byRole.reduce((acc, item) => {
                    acc[item.role] = item._count;
                    return acc;
                }, {}),
            },
        });
    } catch (error) {
        console.error('getUserStats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user stats' });
    }
};

const assignRole = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { role } = req.body;

        const user = await tenantDb.user.update({
            where: { id },
            data: { role },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
            },
        });

        res.json({ success: true, data: { user }, message: 'Role assigned successfully' });
    } catch (error) {
        console.error('assignRole error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign role' });
    }
};

const getUserActivity = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { limit = 50, offset = 0 } = req.query;

        // Get audit logs for this user
        const activities = await tenantDb.auditLog.findMany({
            where: { userId: id },
            orderBy: { createdAt: 'desc' },
            take: parseInt(limit),
            skip: parseInt(offset),
            select: {
                id: true,
                action: true,
                entityType: true,
                entityId: true,
                changes: true,
                ipAddress: true,
                userAgent: true,
                createdAt: true,
            }
        });

        const total = await tenantDb.auditLog.count({
            where: { userId: id }
        });

        res.json({
            success: true,
            data: {
                activities,
                pagination: {
                    total,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            }
        });
    } catch (error) {
        console.error('getUserActivity error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch user activity' });
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createUser,
    updateUser,
    deleteUser,
    updateUserStatus,
    resetPassword,
    bulkImportUsers,
    getUserStats,
    assignRole,
    getUserActivity,
};
