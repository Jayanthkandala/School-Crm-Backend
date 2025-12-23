const express = require('express');
const router = express.Router();
const studentController = require('./student.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');

// All student routes require authentication as student
router.use(authenticateSchoolUser);

// Middleware to verify user is a student
const requireStudent = (req, res, next) => {
    if (req.user.role !== 'STUDENT') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Student access required.',
        });
    }
    next();
};

router.use(requireStudent);

/**
 * @swagger
 * /student/dashboard:
 *   get:
 *     summary: Get student dashboard
 *     tags: [Student Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student dashboard data
 */
router.get('/dashboard', studentController.getDashboard);

router.get('/profile', studentController.getProfile);
router.put('/profile', studentController.updateProfile);
router.post('/change-password', studentController.changePassword);
router.get('/timetable', studentController.getTimetable);
router.get('/attendance', studentController.getAttendance);
router.get('/grades', studentController.getGrades);
router.get('/assignments', studentController.getAssignments);
router.post('/assignments/:assignmentId/submit', studentController.submitAssignment);
router.get('/assignments/:assignmentId/grade', studentController.getAssignmentGrade);
router.get('/exams', studentController.getExams);
router.get('/exams/:examId/hall-ticket', studentController.downloadHallTicket);
router.get('/exams/:examId/results', studentController.getExamResults);
router.get('/fees/invoices', studentController.getFeeInvoices);
router.get('/fees/payments', studentController.getPayments);
router.get('/fees/receipts/:paymentId', studentController.downloadReceipt);
router.get('/library/issued-books', studentController.getLibraryBooks);
router.get('/library/search', studentController.searchLibraryBooks);
router.post('/library/reserve', studentController.reserveBook);
router.post('/certificates/request', studentController.requestCertificate);
router.get('/certificates', studentController.getCertificates);

module.exports = router;
