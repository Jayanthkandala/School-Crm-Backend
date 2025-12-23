const express = require('express');
const router = express.Router();
const communicationController = require('./communication.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/announcements:
 *   get:
 *     summary: Get all announcements
 *     tags: [School - Communication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/announcements', communicationController.getAllAnnouncements);
router.post('/announcements', requireSchoolAdmin, communicationController.createAnnouncement);
/**
 * @swagger
 * /school/announcements/:id/publish:
 *   post:
 *     summary: Create announcements
 *     tags: [School - Communication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/announcements/:id/publish', requireSchoolAdmin, communicationController.publishAnnouncement);
/**
 * @swagger
 * /school/events:
 *   get:
 *     summary: Get all events
 *     tags: [School - Communication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/events', communicationController.getAllEvents);
router.post('/events', requireSchoolAdmin, communicationController.createEvent);
/**
 * @swagger
 * /school/messages/send:
 *   post:
 *     summary: Create messages
 *     tags: [School - Communication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/messages/send', requireTeacherOrAdmin, communicationController.sendMessage);
/**
 * @swagger
 * /school/messages/bulk:
 *   post:
 *     summary: Create messages
 *     tags: [School - Communication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/messages/bulk', requireSchoolAdmin, communicationController.sendBulkMessage);

module.exports = router;
