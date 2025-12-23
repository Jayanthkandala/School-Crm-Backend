const express = require('express');
const router = express.Router();
const examsController = require('./exams.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/exams:
 *   get:
 *     summary: Get all exams
 *     tags: [School - Exams]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *       - in: query
 *         name: examType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of exams
 */
router.get('/', requireTeacherOrAdmin, examsController.getAllExams);

router.get('/:id', requireTeacherOrAdmin, examsController.getExamById);
router.post('/', requireSchoolAdmin, examsController.createExam);
router.put('/:id', requireSchoolAdmin, examsController.updateExam);
router.delete('/:id', requireSchoolAdmin, examsController.deleteExam);

/**
 * @swagger
 * /school/exams/grades/enter:
 *   post:
 *     summary: Enter grades for exam
 *     tags: [School - Exams]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               examId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               grades:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Grades entered
 */
router.post('/grades/enter', requireTeacherOrAdmin, examsController.enterGrades);
router.post('/grades/bulk-import', requireTeacherOrAdmin, examsController.bulkImportGrades);

// Student grades
router.get('/students/:studentId/grades', requireTeacherOrAdmin, examsController.getStudentGrades);

// Exam-specific routes (must be before /:id to avoid conflicts)
router.get('/:examId/grades', requireTeacherOrAdmin, examsController.getExamGrades);
router.get('/:examId/results', requireTeacherOrAdmin, examsController.getExamResults);
router.get('/:examId/timetable', requireTeacherOrAdmin, examsController.getExamTimetable);
router.get('/:examId/toppers', requireTeacherOrAdmin, examsController.getToppers);
router.get('/:examId/stats', requireTeacherOrAdmin, examsController.getExamStats);

// Report card and hall ticket generation
router.get('/students/:studentId/exams/:examId/report-card', requireTeacherOrAdmin, examsController.generateReportCard);
router.get('/students/:studentId/exams/:examId/hall-ticket', requireTeacherOrAdmin, examsController.generateHallTicket);

module.exports = router;
