const { getTenantPrismaClient } = require('../../utils/tenantDb');

const createSubject = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { subjectName, subjectCode, description } = req.body;

        const subject = await tenantDb.subject.create({
            data: {
                subjectName,
                subjectCode,
                description
            }
        });

        res.status(201).json({ success: true, data: { subject } });
    } catch (error) {
        console.error('Create subject error:', error);
        res.status(500).json({ success: false, message: 'Failed to create subject' });
    }
};

const getAllSubjects = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const subjects = await tenantDb.subject.findMany({
            include: {
                teachers: {
                    include: {
                        teacher: {
                            include: { user: { select: { fullName: true } } }
                        }
                    }
                }
            },
            orderBy: { subjectName: 'asc' }
        });

        res.json({ success: true, data: { subjects } });
    } catch (error) {
        console.error('Get all subjects error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
    }
};

const getSubjectById = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        const subject = await tenantDb.subject.findUnique({
            where: { id },
            include: {
                teachers: {
                    include: {
                        teacher: {
                            include: { user: { select: { fullName: true } } }
                        }
                    }
                },
                classes: {
                    include: {
                        class: { select: { className: true, section: true } }
                    }
                }
            }
        });

        if (!subject) {
            return res.status(404).json({ success: false, message: 'Subject not found' });
        }

        res.json({ success: true, data: { subject } });
    } catch (error) {
        console.error('Get subject error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subject' });
    }
};

const updateSubject = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { subjectName, subjectCode, description } = req.body;

        // Check if subjectCode is being changed and if it already exists
        if (subjectCode) {
            const existing = await tenantDb.subject.findFirst({
                where: {
                    subjectCode,
                    NOT: { id }
                }
            });
            if (existing) {
                return res.status(400).json({
                    success: false,
                    message: 'Subject code already exists'
                });
            }
        }

        const subject = await tenantDb.subject.update({
            where: { id },
            data: {
                subjectName,
                subjectCode,
                description
            }
        });

        res.json({ success: true, message: 'Subject updated', data: { subject } });
    } catch (error) {
        console.error('Update subject error:', error);
        res.status(500).json({ success: false, message: 'Failed to update subject' });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        await tenantDb.subject.delete({ where: { id } });

        res.json({ success: true, message: 'Subject deleted' });
    } catch (error) {
        console.error('Delete subject error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete subject' });
    }
};

const assignTeacher = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const { teacherId } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        const assignment = await tenantDb.subjectTeacher.create({
            data: {
                subjectId: id,
                teacherId
            }
        });

        res.json({ success: true, message: 'Teacher assigned', data: { assignment } });
    } catch (error) {
        console.error('Assign teacher error:', error);
        if (error.code === 'P2002') { // Unique constraint
            return res.status(400).json({ success: false, message: 'Teacher already assigned to this subject' });
        }
        res.status(500).json({ success: false, message: 'Failed to assign teacher' });
    }
};

module.exports = {
    createSubject,
    getAllSubjects,
    getSubjectById,
    updateSubject,
    deleteSubject,
    assignTeacher
};
