const tenantDb = require('../../utils/tenantDb');

// Teacher creates homework
exports.createHomework = async (req, res) => {
    try {
        const { classId, subjectId, title, description, dueDate, maxMarks } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const homework = await prisma.homework.create({
            data: {
                classId,
                subjectId,
                title,
                description,
                dueDate: new Date(dueDate),
                maxMarks: maxMarks ? parseInt(maxMarks) : null
            }
        });

        res.json({ success: true, data: homework });
    } catch (error) {
        console.error('Create Homework Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create homework' });
    }
};

// Get homework for a class (Teacher/Student)
exports.getClassHomework = async (req, res) => {
    try {
        const { classId } = req.params;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const homeworkList = await prisma.homework.findMany({
            where: { classId },
            orderBy: { createdAt: 'desc' },
            include: { subject: true }
        });

        res.json({ success: true, data: homeworkList });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch homework' });
    }
};

// Student submits homework (or marks as done)
exports.submitHomework = async (req, res) => {
    try {
        const { homeworkId, submissionText, attachments } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        // Assuming studentId comes from user or body. If user is student:
        const studentId = req.user.studentId; // Need to ensure studentId is in token or looked up

        const submission = await prisma.homeworkCompletion.create({
            data: {
                homeworkId,
                studentId,
                status: 'SUBMITTED',
                submissionDate: new Date(),
                submissionText,
                attachments // Handle JSON/Array storage if supported or stringify
            }
        });

        res.json({ success: true, data: submission });
    } catch (error) {
        console.error('Submit Homework Error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit homework' });
    }
};
