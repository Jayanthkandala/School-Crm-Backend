const { getTenantPrismaClient } = require('../../utils/tenantDb');
const { calculateAttendancePercentage } = require('../../utils/calculations');

const getDashboard = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const parent = await tenantDb.parent.findFirst({
            where: { userId },
            include: {
                children: {
                    include: {
                        student: {
                            include: {
                                user: { select: { fullName: true } },
                                class: { select: { className: true } },
                            },
                        },
                    },
                },
            },
        });

        res.json({ success: true, data: { children: parent?.children || [] } });
    } catch (error) {
        console.error('Parent dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
    }
};

const getChildAttendance = async (req, res) => {
    try {
        const { childId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const [attendance, total, present] = await Promise.all([
            tenantDb.attendance.findMany({
                where: { studentId: childId },
                orderBy: { date: 'desc' },
                take: 30,
            }),
            tenantDb.attendance.count({ where: { studentId: childId } }),
            tenantDb.attendance.count({ where: { studentId: childId, status: 'PRESENT' } }),
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

const getChildGrades = async (req, res) => {
    try {
        const { childId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const grades = await tenantDb.grade.findMany({
            where: { studentId: childId },
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

const getFeeInvoices = async (req, res) => {
    try {
        const { childId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const invoices = await tenantDb.feeInvoice.findMany({
            where: { studentId: childId },
            include: { payments: true },
            orderBy: { dueDate: 'desc' },
        });

        res.json({ success: true, data: { invoices } });
    } catch (error) {
        console.error('Get invoices error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch invoices' });
    }
};

const getChildren = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const parent = await tenantDb.parent.findFirst({
            where: { userId },
            include: {
                children: {
                    include: {
                        student: {
                            include: {
                                user: { select: { fullName: true, email: true, phone: true } },
                                class: { select: { className: true, section: true } },
                            },
                        },
                    },
                },
            },
        });

        if (!parent) {
            return res.status(404).json({ success: false, message: 'Parent not found' });
        }

        const children = parent.children.map(c => ({
            id: c.student.id,
            admissionNumber: c.student.admissionNumber,
            name: c.student.user.fullName,
            email: c.student.user.email,
            phone: c.student.user.phone,
            class: `${c.student.class.className} - ${c.student.class.section}`,
            isPrimary: c.isPrimary,
        }));

        res.json({ success: true, data: { children } });
    } catch (error) {
        console.error('Get children error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch children' });
    }
};


// Apply Leave for Child
const applyLeave = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { childId } = req.params; // Get from route params
        const { fromDate, toDate, reason } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Verify parent owns this student
        const parentStudent = await tenantDb.parentStudent.findFirst({
            where: {
                parent: { userId },
                studentId: childId
            }
        });

        if (!parentStudent) {
            return res.status(403).json({ success: false, message: 'Unauthorized access' });
        }

        const leaveRequest = await tenantDb.studentLeaveRequest.create({
            data: {
                studentId: childId,
                fromDate: new Date(fromDate),
                toDate: new Date(toDate),
                reason,
                status: 'PENDING'
            }
        });

        res.json({ success: true, message: 'Leave application submitted successfully', data: { leaveRequest } });
    } catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({ success: false, message: 'Failed to apply leave' });
    }
};

// Get Report Cards
const getReportCards = async (req, res) => {
    try {
        const { childId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Get all grades grouped by exam
        const grades = await tenantDb.grade.findMany({
            where: { studentId: childId },
            include: {
                exam: true,
                subject: true
            },
            orderBy: { createdAt: 'desc' }
        });

        // Group by exam
        const reportCards = grades.reduce((acc, grade) => {
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

        res.json({ success: true, data: { reportCards: Object.values(reportCards) } });
    } catch (error) {
        console.error('Get report cards error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch report cards' });
    }
};

// Download Report Card
const downloadReportCard = async (req, res) => {
    try {
        const { childId, examId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findUnique({
            where: { id: childId },
            include: {
                user: true,
                class: true
            }
        });

        const exam = await tenantDb.exam.findUnique({
            where: { id: examId }
        });

        const grades = await tenantDb.grade.findMany({
            where: { studentId: childId, examId },
            include: { subject: true }
        });

        // Generate report card PDF
        const { generateReportPDF } = require('../../utils/pdfGenerator');

        const subjectRows = grades.map(g => [
            g.subject.subjectName,
            g.marksObtained?.toString() || '0',
            exam.totalMarks?.toString() || '100'
        ]);

        const totalObtained = grades.reduce((sum, g) => sum + (g.marksObtained || 0), 0);
        const totalMarks = grades.length * (exam.totalMarks || 100);
        const percentage = totalMarks > 0 ? ((totalObtained / totalMarks) * 100).toFixed(2) : 0;

        const { filepath, filename } = await generateReportPDF({
            reportType: 'report_card',
            title: `REPORT CARD - ${exam.examName}`,
            sections: [
                {
                    title: 'Student Details',
                    content: `Name: ${student.user.fullName}\nAdmission No: ${student.admissionNumber}\nClass: ${student.class.className} - ${student.class.section}`
                },
                {
                    title: 'Marks Obtained',
                    table: [
                        ['Subject', 'Marks Obtained', 'Total Marks'],
                        ...subjectRows,
                        ['TOTAL', totalObtained.toString(), totalMarks.toString()],
                        ['PERCENTAGE', percentage + '%', '']
                    ]
                }
            ]
        });

        res.json({
            success: true,
            data: { pdfUrl: `/uploads/reports/${filename}`, pdfPath: filepath },
            message: 'Report card generated successfully'
        });
    } catch (error) {
        console.error('Download report card error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate report card' });
    }
};

// Pay Fee Online
const payFeeOnline = async (req, res) => {
    try {
        const { invoiceId, amount, paymentMethod, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Verify Razorpay signature if online payment
        if (paymentMethod === 'ONLINE' && razorpayPaymentId) {
            const crypto = require('crypto');
            const generatedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpayOrderId}|${razorpayPaymentId}`)
                .digest('hex');

            if (generatedSignature !== razorpaySignature) {
                return res.status(400).json({ success: false, message: 'Invalid payment signature' });
            }
        }

        // Create payment record
        const payment = await tenantDb.feePayment.create({
            data: {
                invoiceId,
                amount: parseFloat(amount),
                paymentMethod,
                paymentDate: new Date(),
                transactionId: razorpayPaymentId || `CASH-${Date.now()}`,
                status: 'COMPLETED'
            }
        });

        // Update invoice balance
        await tenantDb.feeInvoice.update({
            where: { id: invoiceId },
            data: {
                paidAmount: { increment: parseFloat(amount) },
                balance: { decrement: parseFloat(amount) },
                status: 'PAID'
            }
        });

        res.json({ success: true, message: 'Payment successful', data: { payment } });
    } catch (error) {
        console.error('Pay fee online error:', error);
        res.status(500).json({ success: false, message: 'Payment failed' });
    }
};

// Get Payment History
const getPaymentHistory = async (req, res) => {
    try {
        const { childId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const payments = await tenantDb.feePayment.findMany({
            where: {
                invoice: { studentId: childId }
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
        console.error('Get payment history error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
    }
};

// Download Receipt
const downloadReceipt = async (req, res) => {
    try {
        const { paymentId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

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

        if (!payment) {
            return res.status(404).json({ success: false, message: 'Payment not found' });
        }

        // Generate receipt PDF
        const { generateFeeReceiptPDF } = require('../../utils/pdfGenerator');
        const { filepath, filename } = await generateFeeReceiptPDF({
            receiptNumber: payment.id.substring(0, 8).toUpperCase(),
            schoolName: 'School Name',
            schoolAddress: '',
            studentName: payment.invoice.student.user.fullName,
            admissionNumber: payment.invoice.student.admissionNumber,
            className: `${payment.invoice.student.class.className} - ${payment.invoice.student.class.section}`,
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

// Get Timetable
const getTimetable = async (req, res) => {
    try {
        const { childId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findUnique({
            where: { id: childId },
            select: { classId: true }
        });

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

// Get Events
const getEvents = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Get upcoming exams as events
        const exams = await tenantDb.exam.findMany({
            where: {
                startDate: { gte: new Date() }
            },
            include: {
                subject: true,
                class: true
            },
            orderBy: { startDate: 'asc' },
            take: 10
        });

        const events = exams.map(exam => ({
            id: exam.id,
            title: `${exam.examName} - ${exam.subject?.subjectName || 'All Subjects'}`,
            date: exam.startDate,
            type: 'EXAM',
            class: `${exam.class.className} - ${exam.class.section}`
        }));

        res.json({ success: true, data: { events } });
    } catch (error) {
        console.error('Get events error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch events' });
    }
};

// Get Exam Schedule
const getExamSchedule = async (req, res) => {
    try {
        const { childId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findUnique({
            where: { id: childId },
            select: { classId: true }
        });

        const exams = await tenantDb.exam.findMany({
            where: {
                classId: student.classId,
                startDate: { gte: new Date() }
            },
            include: {
                subject: true
            },
            orderBy: { startDate: 'asc' }
        });

        res.json({ success: true, data: { exams } });
    } catch (error) {
        console.error('Get exam schedule error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch exam schedule' });
    }
};

// Send Message to Teacher
const sendMessage = async (req, res) => {
    try {
        const { studentId, message } = req.body;
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const parent = await tenantDb.parent.findFirst({
            where: { userId },
            include: { user: true }
        });

        // Get class teacher
        const student = await tenantDb.student.findUnique({
            where: { id: studentId },
            include: {
                class: {
                    include: {
                        classTeacher: {
                            include: { user: true }
                        }
                    }
                }
            }
        });

        if (!student.class.classTeacher) {
            return res.status(404).json({ success: false, message: 'Class teacher not assigned' });
        }

        // Send email to teacher
        try {
            const { sendEmail } = require('../../services/email.service');
            await sendEmail({
                to: student.class.classTeacher.user.email,
                subject: `Message from Parent - ${parent.user.fullName}`,
                template: 'parentCredentialsEmail', // Reuse or create new template
                data: {
                    parentName: parent.user.fullName,
                    email: student.class.classTeacher.user.email,
                    password: '',
                    studentName: student.user?.fullName || '',
                    loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
                }
            });
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

// Request Parent-Teacher Meeting
const requestMeeting = async (req, res) => {
    try {
        const { studentId, preferredDate, purpose } = req.body;
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const parent = await tenantDb.parent.findFirst({
            where: { userId }
        });

        // Create a remark as meeting request
        const student = await tenantDb.student.findUnique({
            where: { id: studentId },
            include: {
                class: {
                    include: { classTeacher: true }
                }
            }
        });

        if (student.class.classTeacher) {
            await tenantDb.studentRemark.create({
                data: {
                    studentId,
                    teacherId: student.class.classTeacher.id,
                    remarkType: 'GENERAL',
                    remark: `Parent Meeting Request: ${purpose} on ${new Date(preferredDate).toLocaleDateString('en-IN')}`,
                    severity: null
                }
            });
        }

        res.json({ success: true, message: 'Meeting request sent successfully' });
    } catch (error) {
        console.error('Request meeting error:', error);
        res.status(500).json({ success: false, message: 'Failed to request meeting' });
    }
};

// Get Messages
const getMessages = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const parent = await tenantDb.parent.findFirst({
            where: { userId },
            include: {
                children: {
                    include: {
                        student: true
                    }
                }
            }
        });

        const studentIds = parent.children.map(c => c.studentId);

        // Get remarks for parent's children
        const messages = await tenantDb.studentRemark.findMany({
            where: {
                studentId: { in: studentIds }
            },
            include: {
                student: {
                    include: { user: true }
                },
                teacher: {
                    include: { user: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json({ success: true, data: { messages } });
    } catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};

// Get Child Assignments
const getAssignments = async (req, res) => {
    try {
        const { childId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const student = await tenantDb.student.findUnique({
            where: { id: childId },
            select: { classId: true }
        });

        const assignments = await tenantDb.assignment.findMany({
            where: { classId: student.classId },
            include: {
                subject: true,
                teacher: {
                    include: {
                        user: { select: { fullName: true } }
                    }
                },
                submissions: {
                    where: { studentId: childId }
                }
            },
            orderBy: { dueDate: 'desc' }
        });

        res.json({ success: true, data: { assignments } });
    } catch (error) {
        console.error('Get assignments error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch assignments' });
    }
};

// Get Child Library Books
const getLibraryBooks = async (req, res) => {
    try {
        const { childId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const books = await tenantDb.libraryTransaction.findMany({
            where: {
                studentId: childId,
                status: 'ISSUED'
            },
            include: {
                book: true
            },
            orderBy: { issueDate: 'desc' }
        });

        res.json({ success: true, data: { books } });
    } catch (error) {
        console.error('Get library books error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch library books' });
    }
};

// Update Profile
const updateProfile = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { fullName, phone, occupation, annualIncome, address, city, state, pinCode } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        const parent = await tenantDb.parent.findFirst({ where: { userId } });

        // Update user details
        await tenantDb.user.update({
            where: { id: userId },
            data: {
                ...(fullName && { fullName }),
                ...(phone && { phone })
            }
        });

        // Update parent details
        await tenantDb.parent.update({
            where: { id: parent.id },
            data: {
                ...(occupation && { occupation }),
                ...(annualIncome !== undefined && { annualIncome: parseFloat(annualIncome) }),
                ...(address && { address }),
                ...(city && { city }),
                ...(state && { state }),
                ...(pinCode && { pinCode })
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
        const { currentPassword, newPassword } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);
        const bcrypt = require('bcrypt');

        const user = await tenantDb.user.findUnique({ where: { id: userId } });

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash and update new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
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

module.exports = {
    getDashboard,
    getChildren,
    getChildAttendance,
    getChildGrades,
    getFeeInvoices,
    applyLeave,
    getReportCards,
    downloadReportCard,
    payFeeOnline,
    getPaymentHistory,
    downloadReceipt,
    getTimetable,
    getEvents,
    getExamSchedule,
    sendMessage,
    requestMeeting,
    getMessages,
    getAssignments,
    getLibraryBooks,
    updateProfile,
    changePassword,
};
