const express = require('express');
const router = express.Router();
const certificatesController = require('./certificates.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/request:
 *   post:
 *     summary: Create request
 *     tags: [School - Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/request', certificatesController.requestCertificate);
router.get('/', certificatesController.getAllCertificates);
/**
 * @swagger
 * /school/generate:
 *   post:
 *     summary: Create generate
 *     tags: [School - Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/generate', requireSchoolAdmin, certificatesController.generateCertificate);
/**
 * @swagger
 * /school/verify/:verificationCode:
 *   get:
 *     summary: Get verify by ID
 *     tags: [School - Certificates]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/verify/:verificationCode', certificatesController.verifyCertificate);
router.get('/:id/download', certificatesController.downloadCertificate);

module.exports = router;
