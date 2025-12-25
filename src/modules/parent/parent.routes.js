const express = require('express');
const router = express.Router();
const parentController = require('./parent.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');

// All parent routes require authentication as parent
router.use(authenticateSchoolUser);

// Middleware to verify user is a parent
const requireParent = (req, res, next) => {
    if (req.user.role !== 'PARENT') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Parent access required.',
        });
    }
    next();
};

router.use(requireParent);

/**
 * @swagger
 * /parent/dashboard:
 *   get:
 *     summary: Get parent dashboard
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Parent dashboard data
 */
router.get('/dashboard', parentController.getDashboard);

/**
 * @swagger
 * /parent/children:
 *   get:
 *     summary: Get all children
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of children
 */
router.get('/children', parentController.getChildren);

/**
 * @swagger
 * /parent/children/{childId}/attendance:
 *   get:
 *     summary: Get child's attendance
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Child's attendance
 */
router.get('/children/:childId/attendance', parentController.getChildAttendance);

/**
 * @swagger
 * /parent/children/{childId}/leave/apply:
 *   post:
 *     summary: Apply leave for child
 *     tags: [Parent Portal]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: childId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fromDate:
 *                 type: string
 *                 format: date
 *               toDate:
 *                 type: string
 *                 format: date
 *               reason:
 *                 type: string
 *     responses:
 *       201:
 *         description: Leave applied successfully
 */
router.post('/children/:childId/leave/apply', parentController.applyLeave);
router.get('/leave-requests', parentController.getLeaveRequests);


router.get('/children/:childId/grades', parentController.getChildGrades);
router.get('/children/:childId/report-cards', parentController.getReportCards);
router.get('/children/:childId/report-cards/:examId/download', parentController.downloadReportCard);
router.get('/children/:childId/fees/invoices', parentController.getFeeInvoices);
router.post('/fees/pay', parentController.payFeeOnline);
router.get('/children/:childId/fees/payments', parentController.getPaymentHistory);
router.get('/fees/receipts/:paymentId/download', parentController.downloadReceipt);
router.get('/children/:childId/timetable', parentController.getTimetable);
router.get('/events', parentController.getEvents);
router.get('/children/:childId/exams', parentController.getExamSchedule);
router.post('/messages/send', parentController.sendMessage);
router.post('/meetings/request', parentController.requestMeeting);
router.get('/messages', parentController.getMessages);
router.get('/children/:childId/assignments', parentController.getAssignments);
router.get('/children/:childId/library/books', parentController.getLibraryBooks);

// Profile management
router.put('/profile', parentController.updateProfile);
router.post('/change-password', parentController.changePassword);

module.exports = router;
