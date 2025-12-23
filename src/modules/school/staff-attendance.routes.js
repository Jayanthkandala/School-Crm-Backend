const express = require('express');
const router = express.Router();
const staffAttendanceController = require('./staff-attendance.controller');
const { requireSchoolRole } = require('../../middleware/permission.middleware');

/**
 * @swagger
 * tags:
 *   name: School - Staff Attendance
 *   description: Management of teacher and staff attendance
 */

/**
 * @swagger
 * /school/staff-attendance/mark:
 *   post:
 *     summary: Mark attendance for multiple staff members
 *     tags: [School - Staff Attendance]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [date, records]
 *             properties:
 *               date:
 *                 type: string
 *                 format: date
 *               records:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     teacherId:
 *                       type: string
 *                     status:
 *                       type: string
 *                       enum: [PRESENT, ABSENT, LATE, HALF_DAY, LEAVE]
 *                     remarks:
 *                       type: string
 *     responses:
 *       200:
 *         description: Attendance marked successfully
 */
router.post('/mark', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL'), staffAttendanceController.markStaffAttendance);

/**
 * @swagger
 * /school/staff-attendance/daily:
 *   get:
 *     summary: Get staff attendance for a specific date
 *     tags: [School - Staff Attendance]
 *     parameters:
 *       - in: query
 *         name: date
 *         required: true
 *         schema:
 *           type: string
 *           format: date
 *     responses:
 *       200:
 *         description: List of staff attendance records
 */
router.get('/daily', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL'), staffAttendanceController.getDailyStaffAttendance);

/**
 * @swagger
 * /school/staff-attendance/report:
 *   get:
 *     summary: Get monthly staff attendance report
 *     tags: [School - Staff Attendance]
 *     parameters:
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
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Monthly attendance report
 */
router.get('/report', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'), staffAttendanceController.getStaffAttendanceReport);

/**
 * @swagger
 * /school/staff-attendance/check-in:
 *   post:
 *     summary: Teacher self check-in
 *     tags: [School - Staff Attendance]
 *     responses:
 *       200:
 *         description: Checked in successfully
 */
router.post('/check-in', requireSchoolRole('TEACHER'), staffAttendanceController.selfCheckIn);

/**
 * @swagger
 * /school/staff-attendance/check-out:
 *   post:
 *     summary: Teacher self check-out
 *     tags: [School - Staff Attendance]
 *     responses:
 *       200:
 *         description: Checked out successfully
 */
router.post('/check-out', requireSchoolRole('TEACHER'), staffAttendanceController.selfCheckOut);

module.exports = router;
