const express = require('express');
const router = express.Router();
const assignmentsController = require('./assignments.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/assignments:
 *   get:
 *     summary: Get all assignments
 *     tags: [School - Assignments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: subjectId
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of assignments
 */
router.get('/', requireTeacherOrAdmin, assignmentsController.getAllAssignments);

router.get('/my-assignments', requireTeacherOrAdmin, assignmentsController.getMyAssignments);

router.get('/:id', requireTeacherOrAdmin, assignmentsController.getAssignmentById);

/**
 * @swagger
 * /school/assignments:
 *   post:
 *     summary: Create new assignment
 *     tags: [School - Assignments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - classId
 *               - subjectId
 *               - dueDate
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               classId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               maxMarks:
 *                 type: integer
 *               attachmentUrl:
 *                 type: string
 *     responses:
 *       201:
 *         description: Assignment created
 */
router.post('/', requireTeacherOrAdmin, assignmentsController.createAssignment);

router.put('/:id', requireTeacherOrAdmin, assignmentsController.updateAssignment);
router.delete('/:id', requireTeacherOrAdmin, assignmentsController.deleteAssignment);
router.get('/:id/submissions', requireTeacherOrAdmin, assignmentsController.getSubmissions);
router.post('/:id/submissions/:submissionId/grade', requireTeacherOrAdmin, assignmentsController.gradeSubmission);
router.get('/:id/stats', requireTeacherOrAdmin, assignmentsController.getAssignmentStats);
router.post('/:id/bulk-grade', requireTeacherOrAdmin, assignmentsController.bulkGrade);

module.exports = router;
