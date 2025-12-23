const { getTenantPrismaClient } = require('../../utils/tenantDb');
const { calculateAttendancePercentage } = require('../../utils/calculations');

const getDashboard = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({
            where: { userId },
            include: {
                user: true,
                class: true,
            },
        });

        const [attendance, grades, assignments] = await Promise.all([
            tenantDb.attendance.count({ where: { studentId: student.id } }),
            tenantDb.grade.findMany({
                where: { studentId: student.id },
                take: 5,
                orderBy: { createdAt: 'desc' },
            }),
            tenantDb.assignmentSubmission.findMany({
                where: { studentId: student.id, gradedAt: null },
                include: { assignment: true },
            }),
        ]);

        res.json({
            success: true,
            data: {
                student,
                attendance: { total: attendance },
                recentGrades: grades,
                pendingAssignments: assignments,
            },
        });
    } catch (error) {
        console.error('Student dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
    }
};

const getProfile = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({
            where: { userId },
            include: {
                user: true,
                class: true,
            },
        });

        res.json({ success: true, data: { student } });
    } catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
};

const getAttendance = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const [attendance, total, present] = await Promise.all([
            tenantDb.attendance.findMany({
                where: { studentId: student.id },
                orderBy: { date: 'desc' },
            }),
            tenantDb.attendance.count({ where: { studentId: student.id } }),
            tenantDb.attendance.count({ where: { studentId: student.id, status: 'PRESENT' } }),
        ]);

        res.json({
            success: true,
            data: {
                attendance,
                summary: {
                    total,
                    present,
                    percentage: calculateAttendancePercentage(present, total),
                },
            },
        });
    } catch (error) {
        console.error('Get attendance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch attendance' });
    }
};

const getGrades = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const grades = await tenantDb.grade.findMany({
            where: { studentId: student.id },
            include: {
                exam: true,
                subject: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { grades } });
    } catch (error) {
        console.error('Get grades error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch grades' });
    }
};

const getAssignments = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const assignments = await tenantDb.assignment.findMany({
            where: { classId: student.classId },
            include: {
                submissions: {
                    where: { studentId: student.id },
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

// Update Profile
const updateProfile = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { fullName, phone, address, city, state, pinCode, bloodGroup } = req.body;

        const student = await tenantDb.student.findFirst({ where: { userId } });

        // Update user details
        await tenantDb.user.update({
            where: { id: userId },
            data: {
                ...(fullName && { fullName }),
                ...(phone && { phone }),
            }
        });

        // Update student details
        await tenantDb.student.update({
            where: { id: student.id },
            data: {
                ...(address && { address }),
                ...(city && { city }),
                ...(state && { state }),
                ...(pinCode && { pinCode }),
                ...(bloodGroup && { bloodGroup }),
            }
        });

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { currentPassword, newPassword } = req.body;
        const bcrypt = require('bcrypt');

        const user = await tenantDb.user.findUnique({ where: { id: userId } });

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash and update new password
        const hashedPassword = await hashPassword(newPassword);
        await tenantDb.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword }
        });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
};

// Get Timetable
const getTimetable = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const timetable = await tenantDb.timetableEntry.findMany({
            where: { classId: student.classId },
            include: {
                subject: true,
                teacher: {
                    include: {
                        user: { select: { fullName: true } }
                    }
                }
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });

        res.json({ success: true, data: { timetable } });
    } catch (error) {
        console.error('Get timetable error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch timetable' });
    }
};

// Submit Assignment
const submitAssignment = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { assignmentId, submissionText, attachments } = req.body;

        const student = await tenantDb.student.findFirst({ where: { userId } });

        // Check if already submitted
        const existing = await tenantDb.assignmentSubmission.findFirst({
            where: { assignmentId, studentId: student.id }
        });

        if (existing) {
            // Update existing submission
            await tenantDb.assignmentSubmission.update({
                where: { id: existing.id },
                data: {
                    submissionText,
                    attachments: attachments || [],
                    submittedAt: new Date()
                }
            });
        } else {
            // Create new submission
            await tenantDb.assignmentSubmission.create({
                data: {
                    assignmentId,
                    studentId: student.id,
                    submissionText,
                    attachments: attachments || [],
                    submittedAt: new Date()
                }
            });
        }

        res.json({ success: true, message: 'Assignment submitted successfully' });
    } catch (error) {
        console.error('Submit assignment error:', error);
        res.status(500).json({ success: false, message: 'Failed to submit assignment' });
    }
};

// Get Assignment Grade
const getAssignmentGrade = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { assignmentId } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const submission = await tenantDb.assignmentSubmission.findFirst({
            where: { assignmentId, studentId: student.id },
            include: {
                assignment: true
            }
        });

        res.json({ success: true, data: { submission } });
    } catch (error) {
        console.error('Get assignment grade error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch grade' });
    }
};

// Get Exams
const getExams = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const exams = await tenantDb.exam.findMany({
            where: { classId: student.classId },
            include: {
                subject: true,
                class: true
            },
            orderBy: { startDate: 'desc' }
        });

        res.json({ success: true, data: { exams } });
    } catch (error) {
        console.error('Get exams error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch exams' });
    }
};

// Download Hall Ticket
const downloadHallTicket = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { examId } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({
            where: { userId },
            include: {
                user: true,
                class: true
            }
        });

        const exam = await tenantDb.exam.findUnique({
            where: { id: examId },
            include: { subject: true }
        });

        // Generate hall ticket PDF
        const { generateReportPDF } = require('../../utils/pdfGenerator');
        const { filepath, filename } = await generateReportPDF({
            reportType: 'hall_ticket',
            title: 'EXAMINATION HALL TICKET',
            sections: [
                {
                    title: 'Student Details',
                    content: `Name: ${student.user.fullName}\nAdmission No: ${student.admissionNumber}\nClass: ${student.class.className} - ${student.class.section}\nRoll No: ${student.rollNumber}`
                },
                {
                    title: 'Examination Details',
                    content: `Exam: ${exam.examName}\nSubject: ${exam.subject?.subjectName || 'All Subjects'}\nDate: ${new Date(exam.startDate).toLocaleDateString('en-IN')}\nTime: ${new Date(exam.startDate).toLocaleTimeString('en-IN')}`
                }
            ]
        });

        res.json({
            success: true,
            data: { pdfUrl: `/uploads/reports/${filename}`, pdfPath: filepath },
            message: 'Hall ticket generated successfully'
        });
    } catch (error) {
        console.error('Download hall ticket error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate hall ticket' });
    }
};

// Get Exam Results
const getExamResults = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const results = await tenantDb.grade.findMany({
            where: { studentId: student.id },
            include: {
                exam: true,
                subject: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Group by exam
        const groupedResults = results.reduce((acc, grade) => {
            const examId = grade.examId;
            if (!acc[examId]) {
                acc[examId] = {
                    exam: grade.exam,
                    subjects: [],
                    totalMarks: 0,
                    obtainedMarks: 0
                };
            }
            acc[examId].subjects.push({
                subject: grade.subject,
                marksObtained: grade.marksObtained,
                totalMarks: grade.exam.totalMarks
            });
            acc[examId].totalMarks += grade.exam.totalMarks || 0;
            acc[examId].obtainedMarks += grade.marksObtained || 0;
            return acc;
        }, {});

        res.json({ success: true, data: { results: Object.values(groupedResults) } });
    } catch (error) {
        console.error('Get exam results error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch results' });
    }
};

// Get Fee Invoices
const getFeeInvoices = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const invoices = await tenantDb.feeInvoice.findMany({
            where: { studentId: student.id },
            include: {
                feeStructure: true,
                payments: true
            },
            orderBy: { dueDate: 'desc' }
        });

        res.json({ success: true, data: { invoices } });
    } catch (error) {
        console.error('Get fee invoices error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
};

// Get Payments
const getPayments = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const payments = await tenantDb.feePayment.findMany({
            where: {
                invoice: {
                    studentId: student.id
                }
            },
            include: {
                invoice: {
                    include: {
                        feeStructure: true
                    }
                }
            },
            orderBy: { paymentDate: 'desc' }
        });

        res.json({ success: true, data: { payments } });
    } catch (error) {
        console.error('Get payments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payments' });
    }
};

// Download Receipt
const downloadReceipt = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({
            where: { userId },
            include: {
                user: true,
                class: true
            }
        });

        const payment = await tenantDb.feePayment.findUnique({
            where: { id: paymentId },
            include: {
                invoice: {
                    include: {
                        student: {
                            include: {
                                user: true,
                                class: true
                            }
                        }
                    }
                }
            }
        });

        // Verify payment belongs to this student
        if (payment.invoice.studentId !== student.id) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        // Generate receipt PDF
        const { generateFeeReceiptPDF } = require('../../utils/pdfGenerator');
        const { filepath, filename } = await generateFeeReceiptPDF({
            receiptNumber: payment.id.substring(0, 8).toUpperCase(),
            schoolName: 'School Name',
            schoolAddress: '',
            studentName: student.user.fullName,
            admissionNumber: student.admissionNumber,
            className: `${student.class.className} - ${student.class.section}`,
            amount: payment.amount,
            paymentDate: payment.paymentDate,
            paymentMethod: payment.paymentMethod,
            transactionId: payment.transactionId
        });

        res.json({
            success: true,
            data: { pdfUrl: `/uploads/receipts/${filename}`, pdfPath: filepath },
            message: 'Receipt generated successfully'
        });
    } catch (error) {
        console.error('Download receipt error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate receipt' });
    }
};

// Get Library Books
const getLibraryBooks = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const issuedBooks = await tenantDb.libraryTransaction.findMany({
            where: {
                studentId: student.id,
                status: 'ISSUED'
            },
            include: {
                book: true
            },
            orderBy: { issueDate: 'desc' }
        });

        res.json({ success: true, data: { books: issuedBooks } });
    } catch (error) {
        console.error('Get library books error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch library books' });
    }
};

// Search Library Books
const searchLibraryBooks = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { query } = req.query;
        const tenantDb = getTenantPrismaClient(tenantId);

        const books = await tenantDb.book.findMany({
            where: {
                OR: [
                    { title: { contains: query, mode: 'insensitive' } },
                    { author: { contains: query, mode: 'insensitive' } },
                    { isbn: { contains: query, mode: 'insensitive' } }
                ],
                availableQuantity: { gt: 0 }
            },
            take: 20
        });

        res.json({ success: true, data: { books } });
    } catch (error) {
        console.error('Search library books error:', error);
        res.status(500).json({ success: false, message: 'Failed to search books' });
    }
};

// Reserve Book
const reserveBook = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { bookId } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const book = await tenantDb.book.findUnique({ where: { id: bookId } });

        if (!book || book.availableQuantity === 0) {
            return res.status(400).json({ success: false, message: 'Book not available' });
        }

        // Check if student already has this book
        const existing = await tenantDb.libraryTransaction.findFirst({
            where: {
                studentId: student.id,
                bookId,
                status: 'ISSUED'
            }
        });

        if (existing) {
            return res.status(400).json({ success: false, message: 'You already have this book' });
        }

        // Create reservation (or issue directly)
        await tenantDb.libraryTransaction.create({
            data: {
                studentId: student.id,
                bookId,
                issueDate: new Date(),
                dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000), // 14 days
                status: 'ISSUED'
            }
        });

        // Update book quantity
        await tenantDb.book.update({
            where: { id: bookId },
            data: { availableQuantity: { decrement: 1 } }
        });

        res.json({ success: true, message: 'Book issued successfully' });
    } catch (error) {
        console.error('Reserve book error:', error);
        res.status(500).json({ success: false, message: 'Failed to reserve book' });
    }
};

// Request Certificate
const requestCertificate = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { certificateType, reason } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        // Generate unique certificate number
        const certificateNumber = `CERT-${Date.now()}-${student.id.substring(0, 6).toUpperCase()}`;

        await tenantDb.certificate.create({
            data: {
                studentId: student.id,
                certificateType,
                certificateNumber,
                reason,
                status: 'REQUESTED'
            }
        });

        res.json({ success: true, message: 'Certificate request submitted successfully' });
    } catch (error) {
        console.error('Request certificate error:', error);
        res.status(500).json({ success: false, message: 'Failed to request certificate' });
    }
};

// Get Certificates
const getCertificates = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findFirst({ where: { userId } });

        const certificates = await tenantDb.certificate.findMany({
            where: { studentId: student.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: { certificates } });
    } catch (error) {
        console.error('Get certificates error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch certificates' });
    }
};

module.exports = {
    getDashboard,
    getProfile,
    updateProfile,
    changePassword,
    getTimetable,
    getAttendance,
    getGrades,
    getAssignments,
    submitAssignment,
    getAssignmentGrade,
    getExams,
    downloadHallTicket,
    getExamResults,
    getFeeInvoices,
    getPayments,
    downloadReceipt,
    getLibraryBooks,
    searchLibraryBooks,
    reserveBook,
    requestCertificate,
    getCertificates,
};
