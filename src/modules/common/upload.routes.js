const express = require('express');
const router = express.Router();
const uploadController = require('./upload.controller');
const { authenticate } = require('../../middleware/auth.middleware');

// All upload routes require authentication
router.use(authenticate);

/**
 * @swagger
 * /common/upload/single:
 *   post:
 *     summary: Upload single file
 *     tags: [Common - Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: File uploaded successfully
 */
router.post('/single', uploadController.uploadSingle);

/**
 * @swagger
 * /common/upload/multiple:
 *   post:
 *     summary: Upload multiple files
 *     tags: [Common - Upload]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Files uploaded successfully
 */
router.post('/multiple', uploadController.uploadMultiple);

/**
 * @swagger
 * /common/upload/{fileId}:
 *   delete:
 *     summary: Delete file
 *     tags: [Common - Upload]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: fileId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: File deleted successfully
 */
router.delete('/:fileId', uploadController.deleteFile);

module.exports = router;
