const express = require('express');
const router = express.Router();
const dashboardController = require('./dashboard.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/overview:
 *   get:
 *     summary: Get all overview
 *     tags: [School - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/overview', requireTeacherOrAdmin, dashboardController.getDashboardOverview);
/**
 * @swagger
 * /school/stats:
 *   get:
 *     summary: Get all stats
 *     tags: [School - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/stats', requireTeacherOrAdmin, dashboardController.getDashboardStats);
/**
 * @swagger
 * /school/charts:
 *   get:
 *     summary: Get all charts
 *     tags: [School - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/charts', requireTeacherOrAdmin, dashboardController.getDashboardCharts);
/**
 * @swagger
 * /school/recent-activities:
 *   get:
 *     summary: Get all recent-activities
 *     tags: [School - Dashboard]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/recent-activities', requireTeacherOrAdmin, dashboardController.getRecentActivities);

module.exports = router;
