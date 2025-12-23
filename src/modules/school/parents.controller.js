const { getTenantPrismaClient } = require('../../utils/tenantDb');
const bcrypt = require('bcryptjs');
const { generateRandomPassword } = require('../../utils/generators');

const getAllParents = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const parents = await tenantDb.parent.findMany({
            include: {
                user: {
                    select: {
                        fullName: true,
                        email: true,
                        phone: true,
                        isActive: true,
                    },
                },
                children: {
                    include: {
                        student: {
                            include: {
                                user: { select: { fullName: true } },
                                class: { select: { className: true, section: true } },
                            },
                        },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { parents, count: parents.length } });
    } catch (error) {
        console.error('getAllParents error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch parents' });
    }
};

const getParentById = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const parent = await tenantDb.parent.findUnique({
            where: { id },
            include: {
                user: true,
                children: {
                    include: {
                        student: {
                            include: {
                                user: true,
                                class: true,
                            },
                        },
                    },
                },
            },
        });

        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }

        res.json({ success: true, data: { parent } });
    } catch (error) {
        console.error('getParentById error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch parent' });
    }
};

const createParent = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { fullName, email, phone, occupation, address } = req.body;

        // Generate password
        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const user = await tenantDb.user.create({
            data: {
                fullName,
                email,
                phone,
                passwordHash: hashedPassword,
                role: 'PARENT',
            },
        });

        // Create parent
        const parent = await tenantDb.parent.create({
            data: {
                userId: user.id,
                occupation,
                address,
            },
            include: {
                user: true,
            },
        });

        res.status(201).json({
            success: true,
            data: { parent, password },
            message: 'Parent created successfully. Please share the credentials.'
        });
    } catch (error) {
        console.error('createParent error:', error);
        res.status(500).json({ success: false, message: 'Failed to create parent', error: error.message });
    }
};

const updateParent = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { fullName, email, phone, occupation, address } = req.body;

        const parent = await tenantDb.parent.findUnique({ where: { id } });
        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }

        // Update user
        if (fullName || email || phone) {
            await tenantDb.user.update({
                where: { id: parent.userId },
                data: {
                    ...(fullName && { fullName }),
                    ...(email && { email }),
                    ...(phone && { phone }),
                },
            });
        }

        // Update parent
        const updatedParent = await tenantDb.parent.update({
            where: { id },
            data: {
                ...(occupation && { occupation }),
                ...(address && { address }),
            },
            include: {
                user: true,
            },
        });

        res.json({ success: true, data: { parent: updatedParent } });
    } catch (error) {
        console.error('updateParent error:', error);
        res.status(500).json({ success: false, message: 'Failed to update parent' });
    }
};

const deleteParent = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const parent = await tenantDb.parent.findUnique({ where: { id } });
        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }

        // Delete parent-student links
        await tenantDb.parentStudent.deleteMany({ where: { parentId: id } });

        // Delete parent
        await tenantDb.parent.delete({ where: { id } });

        // Delete user
        await tenantDb.user.delete({ where: { id: parent.userId } });

        res.json({ success: true, message: 'Parent deleted successfully' });
    } catch (error) {
        console.error('deleteParent error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete parent' });
    }
};

const linkToStudent = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { parentId, studentId, relationship } = req.body;

        // Check if link already exists
        const existing = await tenantDb.parentStudent.findFirst({
            where: { parentId, studentId },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Parent is already linked to this student'
            });
        }

        const link = await tenantDb.parentStudent.create({
            data: {
                parentId,
                studentId,
                relationship: relationship || 'PARENT',
            },
            include: {
                parent: {
                    include: {
                        user: { select: { fullName: true } },
                    },
                },
                student: {
                    include: {
                        user: { select: { fullName: true } },
                    },
                },
            },
        });

        res.status(201).json({ success: true, data: { link } });
    } catch (error) {
        console.error('linkToStudent error:', error);
        res.status(500).json({ success: false, message: 'Failed to link parent to student' });
    }
};

const unlinkFromStudent = async (req, res) => {
    try {
        const { parentId, studentId } = req.body;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        await tenantDb.parentStudent.deleteMany({
            where: { parentId, studentId },
        });

        res.json({ success: true, message: 'Parent unlinked from student successfully' });
    } catch (error) {
        console.error('unlinkFromStudent error:', error);
        res.status(500).json({ success: false, message: 'Failed to unlink parent from student' });
    }
};

const getChildren = async (req, res) => {
    try {
        const { parentId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const children = await tenantDb.parentStudent.findMany({
            where: { parentId },
            include: {
                student: {
                    include: {
                        user: true,
                        class: true,
                    },
                },
            },
        });

        res.json({ success: true, data: { children, count: children.length } });
    } catch (error) {
        console.error('getChildren error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch children' });
    }
};

const sendCredentials = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const parent = await tenantDb.parent.findUnique({
            where: { id },
            include: {
                user: true,
            },
        });

        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }

        // Generate new password
        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        await tenantDb.user.update({
            where: { id: parent.userId },
            data: { passwordHash: hashedPassword },
        });

        // Send email with credentials
        try {
            const { sendEmail } = require('../../services/email.service');
            await sendEmail({
                to: parent.user.email,
                subject: 'Parent Portal Access - Login Credentials',
                template: 'parentCredentialsEmail',
                data: {
                    parentName: parent.user.fullName,
                    email: parent.user.email,
                    password,
                    studentName: parent.students[0]?.user?.fullName || 'Your Child',
                    loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
                }
            });
            console.log(`Credentials email sent to ${parent.user.email}`);
        } catch (emailError) {
            console.error('Failed to send credentials email:', emailError);
            // Don't fail the request, just log the error
        }

        res.json({
            success: true,
            data: { email: parent.user.email, password },
            message: 'Credentials sent successfully'
        });
    } catch (error) {
        console.error('sendCredentials error:', error);
        res.status(500).json({ success: false, message: 'Failed to send credentials' });
    }
};

module.exports = {
    getAllParents,
    getParentById,
    createParent,
    updateParent,
    deleteParent,
    linkToStudent,
    unlinkFromStudent,
    getChildren,
    sendCredentials,
};
