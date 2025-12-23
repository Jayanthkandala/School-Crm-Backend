const express = require('express');
const router = express.Router();
const authController = require('./auth.controller');
const { authenticate, authenticatePlatformUser } = require('../../middleware/auth.middleware');
const { requireOwner } = require('../../middleware/permission.middleware');

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: Authentication and authorization endpoints
 */

/**
 * @swagger
 * /auth/platform/login:
 *   post:
 *     summary: Platform user login (CRM Owner/Staff)
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 example: owner@yourcrm.com
 *               password:
 *                 type: string
 *                 format: password
 *                 example: SecurePassword123!
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/platform/login', authController.platformLogin);

/**
 * @swagger
 * /auth/school/login:
 *   post:
 *     summary: School user login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - subdomain
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               subdomain:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 */
router.post('/school/login', authController.schoolLogin);

/**
 * @swagger
 * /auth/platform/register:
 *   post:
 *     summary: Register platform user (Owner only)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - fullName
 *               - email
 *               - password
 *               - role
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [OWNER, ADMIN, SUPPORT, SALES, FINANCE, DEVELOPER]
 *     responses:
 *       201:
 *         description: User registered
 */
router.post('/platform/register', authenticatePlatformUser, requireOwner, authController.registerPlatformUser);

router.post('/refresh-token', authController.refreshToken);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.get('/me', authenticate, authController.getCurrentUser);
router.post('/logout', authenticate, authController.logout);
router.put('/profile', authenticatePlatformUser, authController.updateProfile);
router.put('/change-password', authenticatePlatformUser, authController.changePassword);

module.exports = router;
