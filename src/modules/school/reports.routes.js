const express = require('express');
const router = express.Router();
const reportsController = require('./reports.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/students:
 *   get:
 *     summary: Get all students
 *     tags: [School - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/students', requireTeacherOrAdmin, reportsController.getStudentReport);
/**
 * @swagger
 * /school/attendance:
 *   get:
 *     summary: Get all attendance
 *     tags: [School - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/attendance', requireTeacherOrAdmin, reportsController.getAttendanceReport);
/**
 * @swagger
 * /school/academic:
 *   get:
 *     summary: Get all academic
 *     tags: [School - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/academic', requireTeacherOrAdmin, reportsController.getAcademicReport);
/**
 * @swagger
 * /school/fees:
 *   get:
 *     summary: Get all fees
 *     tags: [School - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/fees', requireSchoolAdmin, reportsController.getFeeReport);
/**
 * @swagger
 * /school/teachers:
 *   get:
 *     summary: Get all teachers
 *     tags: [School - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/teachers', requireSchoolAdmin, reportsController.getTeacherReport);
/**
 * @swagger
 * /school/dashboard/analytics:
 *   get:
 *     summary: Get all dashboard
 *     tags: [School - Reports]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/dashboard/analytics', requireTeacherOrAdmin, reportsController.getDashboardAnalytics);
router.get('/:reportType/download', requireTeacherOrAdmin, reportsController.exportReport);

module.exports = router;
