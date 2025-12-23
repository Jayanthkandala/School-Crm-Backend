const { getTenantPrismaClient } = require('../../utils/tenantDb');
const { generateCertificateNumber } = require('../../utils/generators');
const PDFDocument = require('pdfkit');

const requestCertificate = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { studentId, certificateType, reason } = req.body;

        const count = await tenantDb.certificate.count();
        const certificateNumber = generateCertificateNumber(count + 1);

        const certificate = await tenantDb.certificate.create({
            data: {
                studentId,
                certificateType,
                certificateNumber,
                reason,
                status: 'REQUESTED',
            },
            include: {
                student: {
                    include: {
                        user: true,
                        class: true,
                    },
                },
            },
        });

        res.status(201).json({ success: true, data: { certificate } });
    } catch (error) {
        console.error('Request certificate error:', error);
        res.status(500).json({ success: false, message: 'Failed to request certificate' });
    }
};

const approveCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        await tenantDb.certificate.update({
            where: { id },
            data: {
                status: 'APPROVED',
                approvedAt: new Date(),
            },
        });

        res.json({ success: true, message: 'Certificate approved' });
    } catch (error) {
        console.error('Approve certificate error:', error);
        res.status(500).json({ success: false, message: 'Failed to approve certificate' });
    }
};

const getCertificates = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const certificates = await tenantDb.certificate.findMany({
            where: { studentId },
            include: {
                student: {
                    include: {
                        user: true,
                        class: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { certificates } });
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
    }
};

const getAllCertificates = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { status } = req.query;

        const where = {};
        if (status) where.status = status;

        const certificates = await tenantDb.certificate.findMany({
            where,
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true } },
                        class: { select: { className: true, section: true } },
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { certificates, count: certificates.length } });
    } catch (error) {
        console.error('getAllCertificates error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
    }
};

const generateCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const certificate = await tenantDb.certificate.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        user: true,
                        class: true,
                    },
                },
            },
        });

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        if (certificate.status !== 'APPROVED') {
            return res.status(400).json({ success: false, message: 'Certificate not approved yet' });
        }

        // Generate verification code
        const verificationCode = `CERT-${certificate.certificateNumber}-${Date.now()}`;

        // Update certificate with verification code and issue date
        await tenantDb.certificate.update({
            where: { id },
            data: {
                verificationCode,
                issuedAt: new Date(),
                status: 'ISSUED',
            },
        });

        // Generate PDF certificate
        const { generateCertificatePDF } = require('../../utils/pdfGenerator');
        const { filepath, filename } = await generateCertificatePDF({
            certificateNumber: verificationCode,
            studentName: certificate.student.user.fullName,
            className: `${certificate.student.class.className} - ${certificate.student.class.section}`,
            description: certificate.description,
            issueDate: new Date()
        });

        res.json({
            success: true,
            data: {
                certificate: {
                    ...certificate,
                    verificationCode,
                    pdfUrl: `/uploads/certificates/${filename}`,
                    pdfPath: filepath
                },
            },
            message: 'Certificate generated successfully'
        });
    } catch (error) {
        console.error('generateCertificate error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate certificate' });
    }
};

const verifyCertificate = async (req, res) => {
    try {
        const { verificationCode } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const certificate = await tenantDb.certificate.findFirst({
            where: { verificationCode },
            include: {
                student: {
                    include: {
                        user: { select: { fullName: true } },
                        class: { select: { className: true, section: true } },
                    },
                },
            },
        });

        if (!certificate) {
            return res.status(404).json({
                success: false,
                message: 'Certificate not found or invalid verification code',
                verified: false
            });
        }

        res.json({
            success: true,
            verified: true,
            data: {
                certificate: {
                    certificateNumber: certificate.certificateNumber,
                    certificateType: certificate.certificateType,
                    studentName: certificate.student.user.fullName,
                    class: `${certificate.student.class.className} ${certificate.student.class.section}`,
                    issuedAt: certificate.issuedAt,
                    status: certificate.status,
                }
            }
        });
    } catch (error) {
        console.error('verifyCertificate error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify certificate' });
    }
};

const downloadCertificate = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const certificate = await tenantDb.certificate.findUnique({
            where: { id },
            include: {
                student: {
                    include: {
                        user: true,
                        class: true,
                    },
                },
            },
        });

        if (!certificate) {
            return res.status(404).json({ success: false, message: 'Certificate not found' });
        }

        if (certificate.status !== 'ISSUED') {
            return res.status(400).json({ success: false, message: 'Certificate not issued yet' });
        }

        // TODO: Generate and return PDF
        // const pdfBuffer = await generateCertificatePDF(certificate);
        // res.setHeader('Content-Type', 'application/pdf');
        // res.setHeader('Content-Disposition', `attachment; filename=certificate-${certificate.certificateNumber}.pdf`);
        // res.send(pdfBuffer);

        res.json({
            success: true,
            message: 'Certificate download ready',
            data: { certificate }
        });
    } catch (error) {
        console.error('downloadCertificate error:', error);
        res.status(500).json({ success: false, message: 'Failed to download certificate' });
    }
};

module.exports = {
    requestCertificate,
    approveCertificate,
    getCertificates,
    getAllCertificates,
    generateCertificate,
    verifyCertificate,
    downloadCertificate,
};
