const express = require('express');
const router = express.Router();
const transportController = require('./transport.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/routes:
 *   get:
 *     summary: Get all routes
 *     tags: [School - Transport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/routes', requireTeacherOrAdmin, transportController.getAllRoutes);
router.get('/routes/:id', requireTeacherOrAdmin, transportController.getRouteById);
/**
 * @swagger
 * /school/routes:
 *   post:
 *     summary: Create routes
 *     tags: [School - Transport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/routes', requireSchoolAdmin, transportController.createRoute);
/**
 * @swagger
 * /school/routes/:id:
 *   put:
 *     summary: Update routes
 *     tags: [School - Transport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/routes/:id', requireSchoolAdmin, transportController.updateRoute);
/**
 * @swagger
 * /school/routes/:id:
 *   delete:
 *     summary: Delete routes
 *     tags: [School - Transport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/routes/:id', requireSchoolAdmin, transportController.deleteRoute);
/**
 * @swagger
 * /school/assign:
 *   post:
 *     summary: Create assign
 *     tags: [School - Transport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/assign', requireSchoolAdmin, transportController.assignStudentToRoute);
/**
 * @swagger
 * /school/routes/:routeId/students:
 *   get:
 *     summary: Get routes by ID
 *     tags: [School - Transport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/routes/:routeId/students', requireTeacherOrAdmin, transportController.getRouteStudents);
/**
 * @swagger
 * /school/stats:
 *   get:
 *     summary: Get all stats
 *     tags: [School - Transport]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/stats', requireTeacherOrAdmin, transportController.getTransportStats);

module.exports = router;
