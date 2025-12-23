const express = require('express');
const router = express.Router();
const parentsController = require('./parents.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/parents:
 *   get:
 *     summary: Get all parents
 *     tags: [School - Parent Management]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of parents
 */
router.get('/', requireTeacherOrAdmin, parentsController.getAllParents);

router.get('/:id', requireTeacherOrAdmin, parentsController.getParentById);

/**
 * @swagger
 * /school/parents:
 *   post:
 *     summary: Create new parent
 *     tags: [School - Parent Management]
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
 *               - phone
 *               - relationship
 *             properties:
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *               relationship:
 *                 type: string
 *                 enum: [FATHER, MOTHER, GUARDIAN]
 *               occupation:
 *                 type: string
 *               address:
 *                 type: string
 *     responses:
 *       201:
 *         description: Parent created
 */
router.post('/', requireSchoolAdmin, parentsController.createParent);

router.put('/:id', requireSchoolAdmin, parentsController.updateParent);
router.delete('/:id', requireSchoolAdmin, parentsController.deleteParent);
router.post('/:id/link-student', requireSchoolAdmin, parentsController.linkToStudent);
router.delete('/:id/unlink-student/:studentId', requireSchoolAdmin, parentsController.unlinkFromStudent);
router.get('/:id/children', requireTeacherOrAdmin, parentsController.getChildren);
router.post('/:id/send-credentials', requireSchoolAdmin, parentsController.sendCredentials);

module.exports = router;
