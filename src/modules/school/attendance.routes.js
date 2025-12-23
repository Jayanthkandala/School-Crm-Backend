const express = require('express');
const router = express.Router();
const attendanceController = require('./attendance.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/attendance/mark:
 *   post:
 *     summary: Mark attendance for a class
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               classId:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               attendance:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     studentId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [PRESENT, ABSENT, LATE, HALF_DAY, ON_LEAVE]
 *     responses:
 *       200:
 *         description: Attendance marked
 */
router.post('/mark', requireTeacherOrAdmin, attendanceController.markAttendance);

/**
 * @swagger
 * /school/attendance/daily:
 *   get:
 *     summary: Get daily attendance for a class
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: Daily attendance
 */
router.get('/daily', requireTeacherOrAdmin, attendanceController.getDailyAttendance);

/**
 * @swagger
 * /school/attendance/student/{studentId}/monthly:
 *   get:
 *     summary: Get monthly attendance for a student
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Student monthly attendance
 */
router.get('/student/:studentId/monthly', requireTeacherOrAdmin, attendanceController.getStudentMonthlyAttendance);

/**
 * @swagger
 * /school/attendance/class/monthly:
 *   get:
 *     summary: Get class monthly attendance
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: month
 *         required: true
 *         schema:
 *           type: integer
 *       - in: query
 *         name: year
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Class monthly attendance
 */
router.get('/class/monthly', requireTeacherOrAdmin, attendanceController.getClassMonthlyAttendance);

/**
 * @swagger
 * /school/attendance/defaulters:
 *   get:
 *     summary: Get attendance defaulters
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: threshold
 *         schema:
 *           type: integer
 *           default: 75
 *     responses:
 *       200:
 *         description: List of defaulters
 */
router.get('/defaulters', requireTeacherOrAdmin, attendanceController.getDefaulters);

/**
 * @swagger
 * /school/attendance/leave/request:
 *   post:
 *     summary: Submit leave request
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
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
 *         description: Leave request submitted
 */
router.post('/leave/request', attendanceController.submitLeaveRequest);

/**
 * @swagger
 * /school/attendance/leave/{id}/status:
 *   put:
 *     summary: Approve/Reject leave request
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
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
 *               status:
 *                 type: string
 *                 enum: [APPROVED, REJECTED]
 *               remarks:
 *                 type: string
 *     responses:
 *       200:
 *         description: Leave request updated
 */
router.put('/leave/:id/status', requireTeacherOrAdmin, attendanceController.updateLeaveStatus);

/**
 * @swagger
 * /school/attendance/leave:
 *   get:
 *     summary: Get all leave requests
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *     responses:
 *       200:
 *         description: List of leave requests
 */
router.get('/leave', requireTeacherOrAdmin, attendanceController.getAllLeaveRequests);
router.get('/leave/requests', requireTeacherOrAdmin, attendanceController.getAllLeaveRequests); // Alias for frontend

/**
 * @swagger
 * /school/attendance/report:
 *   get:
 *     summary: Get attendance report
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: fromDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: toDate
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: format
 *         schema:
 *           type: string
 *           enum: [json, pdf, excel]
 *     responses:
 *       200:
 *         description: Attendance report
 */
router.get('/report', requireTeacherOrAdmin, attendanceController.getAttendanceReport);

/**
 * @swagger
 * /school/attendance/notifications/send:
 *   post:
 *     summary: Send attendance notifications
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               classId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Notifications sent
 */
router.post('/notifications/send', requireTeacherOrAdmin, attendanceController.sendAttendanceNotifications);

/**
 * @swagger
 * /school/attendance/stats:
 *   get:
 *     summary: Get attendance statistics
 *     tags: [School - Attendance]
 *     security:
 *       - bearerAuth: []
 *     parameters:
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
 *         description: Attendance statistics
 */
router.get('/stats', requireTeacherOrAdmin, attendanceController.getAttendanceStats);

module.exports = router;
