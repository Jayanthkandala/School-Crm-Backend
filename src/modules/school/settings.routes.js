const express = require('express');
const router = express.Router();
const settingsController = require('./settings.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/settings:
 *   get:
 *     summary: Get school settings
 *     tags: [School - Settings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: School settings
 */
router.get('/', settingsController.getSettings);

/**
 * @swagger
 * /school/settings:
 *   put:
 *     summary: Update school settings
 *     tags: [School - Settings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               schoolName:
 *                 type: string
 *               logo:
 *                 type: string
 *               primaryColor:
 *                 type: string
 *               secondaryColor:
 *                 type: string
 *     responses:
 *       200:
 *         description: Settings updated
 */
router.put('/', requireSchoolAdmin, settingsController.updateSettings);

module.exports = router;
