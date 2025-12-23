const { getTenantPrismaClient } = require('../../utils/tenantDb');
const { generateAdmissionNumber, generateRandomPassword } = require('../../utils/generators');
const bcrypt = require('bcryptjs');

const createApplication = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const count = await tenantDb.admissionApplication.count();
        const applicationNumber = `APP/${new Date().getFullYear()}/${(count + 1).toString().padStart(4, '0')}`;

        const application = await tenantDb.admissionApplication.create({
            data: {
                ...req.body,
                applicationNumber,
                dateOfBirth: new Date(req.body.dateOfBirth),
                status: 'PENDING',
            },
        });

        res.status(201).json({ success: true, data: { application } });
    } catch (error) {
        console.error('Create application error:', error);
        res.status(500).json({ success: false, message: 'Failed to create application' });
    }
};

const getAllApplications = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { status } = req.query;

        const where = status ? { status } : {};
        const applications = await tenantDb.admissionApplication.findMany({
            where,
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { applications, count: applications.length } });
    } catch (error) {
        console.error('Get applications error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch applications' });
    }
};

const updateApplicationStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { status, remarks } = req.body; // Assuming status and remarks come from req.body for an update

        const application = await tenantDb.admissionApplication.update({
            where: { id },
            data: { status, remarks },
        });

        // Send status update email notification
        try {
            const { sendEmail } = require('../../services/email.service');
            await sendEmail({
                to: application.parentEmail,
                subject: `Admission Application Update - ${status}`,
                template: 'admissionNotificationEmail',
                data: {
                    parentName: application.parentName,
                    studentName: application.studentName,
                    status,
                    remarks
                }
            });
            console.log(`Admission status email sent to ${application.parentEmail}`);
        } catch (emailError) {
            console.error('Failed to send admission status email:', emailError);
        }

        res.json({
            success: true,
            message: 'Application status updated',
            data: { application }
        });
    } catch (error) {
        console.error('Update application status error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update application status'
        });
    }
};

const getApplicationById = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const application = await tenantDb.admissionApplication.findUnique({
            where: { id },
        });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        res.json({ success: true, data: { application } });
    } catch (error) {
        console.error('Get application error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch application' });
    }
};

const updateApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const application = await tenantDb.admissionApplication.update({
            where: { id },
            data: {
                ...req.body,
                ...(req.body.dateOfBirth && { dateOfBirth: new Date(req.body.dateOfBirth) }),
            },
        });

        res.json({ success: true, data: { application } });
    } catch (error) {
        console.error('Update application error:', error);
        res.status(500).json({ success: false, message: 'Failed to update application' });
    }
};

const approveApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const application = await tenantDb.admissionApplication.findUnique({ where: { id } });

        if (!application) {
            return res.status(404).json({ success: false, message: 'Application not found' });
        }

        // Validate Class
        let targetClassId = application.classAppliedFor;
        const targetClass = await tenantDb.class.findFirst({
            where: {
                OR: [
                    // If it's a valid UUID, this works. If not, it fails silently for this condition (usually) or we can check regex.
                    // But simpler to just check Name.
                    { id: targetClassId },
                    { className: { equals: targetClassId, mode: 'insensitive' } }
                ]
            }
        });

        if (!targetClass) {
            return res.status(400).json({ success: false, message: `Class '${targetClassId}' not found in the system. Cannot enroll student.` });
        }

        // Update to valid UUID
        targetClassId = targetClass.id;

        const admissionNumber = generateAdmissionNumber(await tenantDb.student.count() + 1);
        const password = generateRandomPassword();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Transactional Creation
        await tenantDb.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullName: application.studentName,
                    email: application.email || `${admissionNumber}@school.com`,
                    phone: application.phone,
                    passwordHash: hashedPassword,
                    role: 'STUDENT',
                },
            });

            await tx.student.create({
                data: {
                    userId: user.id,
                    admissionNumber,
                    classId: targetClassId, // Use Validated UUID
                    dateOfBirth: application.dateOfBirth,
                    gender: application.gender,
                    aadhaarNumber: application.aadhaarNumber,
                    category: application.category,
                    admissionDate: new Date(),
                    status: 'ACTIVE',
                },
            });

            await tx.admissionApplication.update({
                where: { id },
                data: { status: 'APPROVED', approvedAt: new Date() },
            });
        });

        // Send admission approval email with credentials
        try {
            const { sendEmail } = require('../../services/email.service');
            const classInfo = await tenantDb.class.findUnique({
                where: { id: application.classId }
            });

            await sendEmail({
                to: application.parentEmail,
                subject: 'Admission Approved - Welcome!',
                template: 'admissionApprovalEmail',
                data: {
                    studentName: application.studentName,
                    parentEmail: application.parentEmail,
                    admissionNumber,
                    className: `${classInfo.className} - ${classInfo.section}`,
                    password,
                    loginUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login`
                }
            });
            console.log(`Admission approval email sent to ${application.parentEmail}`);
        } catch (emailError) {
            console.error('Failed to send admission approval email:', emailError);
        }

        res.json({
            success: true,
            message: 'Application approved and student created',
            data: { admissionNumber, password }
        });
    } catch (error) {
        console.error('Approve application error:', error);
        res.status(500).json({ success: false, message: 'Failed to approve application' });
    }
};

const rejectApplication = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { rejectionReason } = req.body;

        await tenantDb.admissionApplication.update({
            where: { id },
            data: { status: 'REJECTED', rejectionReason },
        });

        res.json({ success: true, message: 'Application rejected' });
    } catch (error) {
        console.error('Reject application error:', error);
        res.status(500).json({ success: false, message: 'Failed to reject application' });
    }
};

const getAdmissionStats = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const [total, pending, approved, rejected] = await Promise.all([
            tenantDb.admissionApplication.count(),
            tenantDb.admissionApplication.count({ where: { status: 'PENDING' } }),
            tenantDb.admissionApplication.count({ where: { status: 'APPROVED' } }),
            tenantDb.admissionApplication.count({ where: { status: 'REJECTED' } }),
        ]);

        res.json({
            success: true,
            data: {
                total,
                pending,
                approved,
                rejected,
                approvalRate: total > 0 ? ((approved / total) * 100).toFixed(2) : 0,
            }
        });
    } catch (error) {
        console.error('Get admission stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch admission stats' });
    }
};

const uploadDocuments = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { documents } = req.body; // Array of document URLs

        const application = await tenantDb.admissionApplication.update({
            where: { id },
            data: {
                documents: documents || [],
            },
        });

        res.json({ success: true, data: { application }, message: 'Documents uploaded successfully' });
    } catch (error) {
        console.error('Upload documents error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload documents' });
    }
};

const scheduleInterview = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { interviewDate, interviewTime, venue } = req.body;

        const application = await tenantDb.admissionApplication.update({
            where: { id },
            data: {
                interviewDate: new Date(interviewDate),
                interviewTime,
                venue,
                status: 'INTERVIEW_SCHEDULED',
            },
        });

        // TODO: Send email notification
        res.json({ success: true, data: { application }, message: 'Interview scheduled successfully' });
    } catch (error) {
        console.error('Schedule interview error:', error);
        res.status(500).json({ success: false, message: 'Failed to schedule interview' });
    }
};

module.exports = {
    createApplication,
    getAllApplications,
    getApplicationById,
    updateApplication,
    approveApplication,
    rejectApplication,
    getAdmissionStats,
    uploadDocuments,
    scheduleInterview,
};
