const { getTenantPrismaClient } = require('../../utils/tenantDb');

const createAssignment = async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { title, description, classId, subjectId, teacherId, dueDate, maxMarks, attachmentUrl } = req.body;

        let assignedTeacherId = teacherId;
        if (!assignedTeacherId) {
            // Try to find if current user is a teacher
            const teacherProfile = await tenantDb.teacher.findUnique({ where: { userId } });
            if (teacherProfile) assignedTeacherId = teacherProfile.id;
        }

        if (!assignedTeacherId) {
            return res.status(400).json({ success: false, message: 'Teacher ID is required' });
        }

        const assignment = await tenantDb.assignment.create({
            data: {
                title,
                description,
                classId,
                subjectId,
                teacherId: assignedTeacherId,
                createdBy: userId,
                dueDate: new Date(dueDate),
                maxMarks: parseInt(maxMarks) || 100,
                attachmentUrl,
            },
        });

        res.status(201).json({ success: true, data: { assignment } });
    } catch (error) {
        console.error('Create assignment error:', error);
        res.status(500).json({ success: false, message: 'Failed to create assignment', error: error.message });
    }
};

const submitAssignment = async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { assignmentId } = req.params;
        const { submissionText, attachmentUrl } = req.body;

        const student = await tenantDb.student.findFirst({
            where: { userId },
        });

        const submission = await tenantDb.assignmentSubmission.create({
            data: {
                assignmentId,
                studentId: student.id,
                submissionText,
                attachmentUrl,
            },
        });

        res.status(201).json({ success: true, data: { submission } });
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit assignment' });
    }
};

const gradeSubmission = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { submissionId } = req.params;
        const { marksObtained, feedback } = req.body;

        const submission = await tenantDb.assignmentSubmission.update({
            where: { id: submissionId },
            data: {
                marksObtained: parseFloat(marksObtained),
                feedback,
                gradedAt: new Date(),
            },
        });

        res.json({ success: true, data: { submission } });
    } catch (error) {
        console.error('Grade submission error:', error);
        res.status(500).json({ success: false, message: 'Failed to grade submission' });
    }
};

const getAssignments = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, subjectId } = req.query;

        const where = {};
        if (classId) where.classId = classId;
        if (subjectId) where.subjectId = subjectId;

        const assignments = await tenantDb.assignment.findMany({
            where,
            include: {
                class: true,
                subject: true,
                teacher: {
                    include: { user: { select: { fullName: true } } },
                },
            },
            orderBy: { dueDate: 'desc' },
        });

        res.json({ success: true, data: { assignments } });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
    }
};



const getAllAssignments = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, subjectId, limit = 50, offset = 0 } = req.query;

        const where = {};
        if (classId) where.classId = classId;
        if (subjectId) where.subjectId = subjectId;

        const [assignments, total] = await Promise.all([
            tenantDb.assignment.findMany({
                where,
                include: {
                    class: { select: { className: true, section: true } },
                    subject: { select: { subjectName: true } },
                    teacher: {
                        include: { user: { select: { fullName: true } } }
                    },
                    _count: {
                        select: { submissions: true }
                    }
                },
                orderBy: { dueDate: 'desc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            }),
            tenantDb.assignment.count({ where })
        ]);

        // Format for frontend
        const formatted = assignments.map(a => ({
            id: a.id,
            title: a.title,
            class: `${a.class.className} - ${a.class.section}`,
            subject: a.subject.subjectName,
            status: new Date(a.dueDate) > new Date() ? 'Active' : 'Expired',
            dueDate: a.dueDate,
            submissions: a._count.submissions,
            total: 0 // Ideally this should be total students in class
        }));

        res.json({
            success: true,
            data: {
                assignments: formatted,
                pagination: {
                    total,
                    count: formatted.length,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            }
        });
    } catch (error) {
        console.error('getAllAssignments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
    }
};

const getMyAssignments = async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Find student profile
        const student = await tenantDb.student.findUnique({
            where: { userId }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student profile not found' });
        }

        // Get assignments for student's class
        const assignments = await tenantDb.assignment.findMany({
            where: {
                classId: student.classId
            },
            include: {
                subject: {
                    select: { subjectName: true, subjectCode: true }
                },
                teacher: {
                    include: { user: { select: { fullName: true } } }
                },
                submissions: {
                    where: { studentId: student.id }
                }
            },
            orderBy: { dueDate: 'desc' }
        });

        // Add status flag
        const data = assignments.map(a => {
            const submission = a.submissions[0];
            const isSubmitted = !!submission;
            const isLate = !isSubmitted && new Date() > new Date(a.dueDate);

            return {
                ...a,
                status: isSubmitted ? 'Submitted' : (isLate ? 'Overdue' : 'Pending'),
                submission: submission || null
            };
        });

        res.json({ success: true, data: { assignments: data } });

    } catch (error) {
        console.error('getMyAssignments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
    }
};

const getAssignmentById = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { id } = req.params;

        const assignment = await tenantDb.assignment.findUnique({
            where: { id },
            include: {
                class: { select: { className: true, section: true } },
                subject: { select: { subjectName: true } },
                teacher: {
                    include: { user: { select: { fullName: true } } }
                },
                submissions: {
                    include: {
                        student: {
                            include: { user: { select: { fullName: true } } }
                        }
                    }
                }
            }
        });

        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        res.json({ success: true, data: { assignment } });
    } catch (error) {
        console.error('getAssignmentById error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assignment' });
    }
};

const updateAssignment = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { id } = req.params;
        const { title, description, dueDate, maxMarks, attachmentUrl } = req.body;

        const assignment = await tenantDb.assignment.update({
            where: { id },
            data: {
                ...(title && { title }),
                ...(description && { description }),
                ...(dueDate && { dueDate: new Date(dueDate) }),
                ...(maxMarks && { maxMarks: parseInt(maxMarks) }),
                ...(attachmentUrl !== undefined && { attachmentUrl }),
            }
        });

        res.json({ success: true, data: { assignment }, message: 'Assignment updated successfully' });
    } catch (error) {
        console.error('updateAssignment error:', error);
        res.status(500).json({ success: false, message: 'Failed to update assignment' });
    }
};

const deleteAssignment = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { id } = req.params;

        // Check if assignment exists
        const assignment = await tenantDb.assignment.findUnique({ where: { id } });
        if (!assignment) {
            return res.status(404).json({ success: false, message: 'Assignment not found' });
        }

        // Delete assignment (submissions will be cascade deleted)
        await tenantDb.assignment.delete({ where: { id } });

        res.json({ success: true, message: 'Assignment deleted successfully' });
    } catch (error) {
        console.error('deleteAssignment error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete assignment' });
    }
};

const getSubmissions = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { assignmentId } = req.params;

        const submissions = await tenantDb.assignmentSubmission.findMany({
            where: { assignmentId },
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true } },
                        class: { select: { className: true, section: true } }
                    }
                }
            },
            orderBy: { submittedAt: 'desc' }
        });

        res.json({ success: true, data: { submissions } });
    } catch (error) {
        console.error('getSubmissions error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch submissions' });
    }
};

const getAssignmentStats = async (req, res) => {
    try {
        res.json({
            success: true,
            message: 'getAssignmentStats endpoint',
            data: {}
        });
    } catch (error) {
        console.error('getAssignmentStats error:', error);
        res.status(500).json({ success: false, message: 'Operation failed' });
    }
};

const bulkGrade = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { grades } = req.body; // Array of { submissionId, marksObtained, feedback }

        if (!Array.isArray(grades) || grades.length === 0) {
            return res.status(400).json({ success: false, message: 'Grades array is required' });
        }

        // Use transaction to update all submissions
        const updatedSubmissions = await tenantDb.$transaction(
            grades.map(({ submissionId, marksObtained, feedback }) =>
                tenantDb.assignmentSubmission.update({
                    where: { id: submissionId },
                    data: {
                        marksObtained: parseFloat(marksObtained),
                        feedback,
                        gradedAt: new Date(),
                    }
                })
            )
        );

        res.json({
            success: true,
            data: { count: updatedSubmissions.length },
            message: `Successfully graded ${updatedSubmissions.length} submissions`
        });
    } catch (error) {
        console.error('bulkGrade error:', error);
        res.status(500).json({ success: false, message: 'Failed to grade submissions' });
    }
};
module.exports = {
    createAssignment,
    submitAssignment,
    gradeSubmission,
    getAssignments,
    getAllAssignments,
    getMyAssignments,
    getAssignmentById,
    updateAssignment,
    deleteAssignment,
    getSubmissions,
    getAssignmentStats,
    bulkGrade,
};
