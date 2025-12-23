const express = require('express');
const router = express.Router();
const usersController = require('./users.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level
router.use(requireSchoolAdmin);

/**
 * @swagger
 * /school/users:
 *   get:
 *     summary: Get all users in school
 *     tags: [School - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of users
 */
router.get('/', usersController.getAllUsers);

/**
 * @swagger
 * /school/users/{id}:
 *   get:
 *     summary: Get user by ID
 *     tags: [School - User Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: User details
 */
router.get('/:id', usersController.getUserById);

/**
 * @swagger
 * /school/users:
 *   post:
 *     summary: Create new user
 *     tags: [School - User Management]
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
 *               - role
 *               - password
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [SCHOOL_ADMIN, PRINCIPAL, TEACHER, STUDENT, PARENT, ACCOUNTANT, LIBRARIAN, RECEPTIONIST]
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created
 */
router.post('/', usersController.createUser);

router.put('/:id', usersController.updateUser);
router.delete('/:id', usersController.deleteUser);
router.put('/:id/status', usersController.updateUserStatus);
router.put('/:id/role', usersController.assignRole);
router.post('/:id/reset-password', usersController.resetPassword);
router.get('/:id/activity', usersController.getUserActivity);
router.post('/bulk/import', usersController.bulkImportUsers);
router.get('/stats', usersController.getUserStats);

module.exports = router;
