const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

/**
 * Get all platform users
 */
const getAllUsers = async (req, res) => {
    try {
        console.log('Controller: getAllUsers called');
        const users = await prisma.platformUser.findMany({
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true,
                lastLoginAt: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        console.log(`Controller: Found ${users.length} users`);

        res.json({
            success: true,
            data: { users },
        });
    } catch (error) {
        console.error('Get all users error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch platform users' });
    }
};

/**
 * Create a new platform user
 */
const createUser = async (req, res) => {
    try {
        const { fullName, email, role, password } = req.body;

        const existingUser = await prisma.platformUser.findUnique({
            where: { email },
        });

        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.platformUser.create({
            data: {
                fullName,
                email,
                role,
                passwordHash: hashedPassword,
            },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                createdAt: true,
            },
        });

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: { user },
        });
    } catch (error) {
        console.error('Create user error:', error);
        res.status(500).json({ success: false, message: 'Failed to create user' });
    }
};

/**
 * Update a platform user
 */
const updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { fullName, role, isActive, password } = req.body;

        // Prevent modifying own role or status if not careful (optional safety check)
        if (id === req.user.id && (role || isActive === false)) {
            // Usually we allow self-update of name/password, but changing one's own role/status is risky.
            // For now, let's allow it but frontend should warn.
        }

        const data = {};
        if (fullName) data.fullName = fullName;
        if (role) data.role = role;
        if (typeof isActive === 'boolean') data.isActive = isActive;
        if (password) {
            data.passwordHash = await bcrypt.hash(password, 10);
        }

        const user = await prisma.platformUser.update({
            where: { id },
            data,
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true,
            },
        });

        res.json({
            success: true,
            message: 'User updated successfully',
            data: { user },
        });
    } catch (error) {
        console.error('Update user error:', error);
        res.status(500).json({ success: false, message: 'Failed to update user' });
    }
};

/**
 * Delete a platform user
 */
const deleteUser = async (req, res) => {
    try {
        const { id } = req.params;

        if (id === req.user.id) {
            return res.status(400).json({ success: false, message: 'Cannot delete yourself' });
        }

        await prisma.platformUser.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'User deleted successfully',
        });
    } catch (error) {
        console.error('Delete user error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete user' });
    }
};

module.exports = {
    getAllUsers,
    createUser,
    updateUser,
    deleteUser,
};
