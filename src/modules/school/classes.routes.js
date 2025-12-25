const express = require('express');
const router = express.Router();
const classesController = require('./classes.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/classes:
 *   get:
 *     summary: Get all classes
 *     tags: [School - Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 */
router.get('/', requireTeacherOrAdmin, classesController.getAllClasses);

/**
 * @swagger
 * /school/classes/{id}:
 *   get:
 *     summary: Get class by ID
 *     tags: [School - Classes]
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
 *         description: Class details
 */
router.get('/:id', requireTeacherOrAdmin, classesController.getClassById);

/**
 * @swagger
 * /school/classes:
 *   post:
 *     summary: Create new class
 *     tags: [School - Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Class created
 */
router.post('/', requireSchoolAdmin, classesController.createClass);

/**
 * @swagger
 * /school/classes/{id}:
 *   put:
 *     summary: Update class
 *     tags: [School - Classes]
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
 *         description: Class updated
 */
router.put('/:id', requireSchoolAdmin, classesController.updateClass);

/**
 * @swagger
 * /school/classes/{id}:
 *   delete:
 *     summary: Delete class
 *     tags: [School - Classes]
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
 *         description: Class deleted
 */
router.delete('/:id', requireSchoolAdmin, classesController.deleteClass);

/**
 * @swagger
 * /school/classes/{classId}/subjects:
 *   get:
 *     summary: Get subjects for a class
 *     tags: [School - Classes]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of subjects
 */
router.get('/:classId/subjects', requireTeacherOrAdmin, classesController.getClassSubjects);

/**
 * @swagger
 * /school/classes/assign-subject:
 *   post:
 *     summary: Assign subject to class
 *     tags: [School - Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Subject assigned to class
 */
router.post('/assign-subject', requireSchoolAdmin, classesController.assignSubjectToClass);

/**
 * @swagger
 * /school/classes/stats:
 *   get:
 *     summary: Get class statistics
 *     tags: [School - Classes]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Class statistics
 */
router.get('/stats', requireTeacherOrAdmin, classesController.getClassStats);

module.exports = router;
