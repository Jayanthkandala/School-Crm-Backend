const express = require('express');
const router = express.Router();
const studentsController = require('./students.controller');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication is now handled at the parent router level (school.routes.js)

/**
 * @swagger
 * /school/students:
 *   get:
 *     summary: Get all students
 *     tags: [School - Students]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: classId
 *         schema:
 *           type: string
 *       - in: query
 *         name: section
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, GRADUATED, TRANSFERRED, DROPPED]
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/', requireTeacherOrAdmin, studentsController.getAllStudents);

/**
 * @swagger
 * /school/students/stats:
 *   get:
 *     summary: Get student statistics
 *     tags: [School - Students]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Student statistics
 */
router.get('/stats', requireTeacherOrAdmin, studentsController.getStudentStats);

/**
 * @swagger
 * /school/students/{id}:
 *   get:
 *     summary: Get student by ID
 *     tags: [School - Students]
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
 *         description: Student details
 */
router.get('/:id', requireTeacherOrAdmin, studentsController.getStudentById);

/**
 * @swagger
 * /school/students/{id}/performance:
 *   get:
 *     summary: Get student performance stats
 *     tags: [School - Students]
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
 *         description: Student performance stats
 */
router.get('/:id/performance', requireTeacherOrAdmin, studentsController.getStudentPerformance);

/**
 * @swagger
 * /school/students:
 *   post:
 *     summary: Create new student (Admission)
 *     tags: [School - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - admissionNumber
 *               - firstName
 *               - lastName
 *               - dateOfBirth
 *               - gender
 *             properties:
 *               admissionNumber:
 *                 type: string
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *     responses:
 *       201:
 *         description: Student created
 */
router.post('/', requireSchoolAdmin, studentsController.createStudent);

/**
 * @swagger
 * /school/students/{id}:
 *   put:
 *     summary: Update student
 *     tags: [School - Students]
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
 *         description: Student updated
 */
router.put('/:id', requireSchoolAdmin, studentsController.updateStudent);

/**
 * @swagger
 * /school/students/{id}:
 *   delete:
 *     summary: Delete student
 *     tags: [School - Students]
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
 *         description: Student deleted
 */
router.delete('/:id', requireSchoolAdmin, studentsController.deleteStudent);

/**
 * @swagger
 * /school/students/bulk/import:
 *   post:
 *     summary: Bulk import students
 *     tags: [School - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               students:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Import results
 */
router.post('/bulk-import', requireSchoolAdmin, studentsController.bulkImportStudents);

/**
 * @swagger
 * /school/students/promote:
 *   post:
 *     summary: Promote students to next class
 *     tags: [School - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               currentClassId:
 *                 type: string
 *               targetClassId:
 *                 type: string
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Students promoted
 */
router.post('/promote', requireSchoolAdmin, studentsController.promoteStudents);

/**
 * @swagger
 * /school/students/{id}/transfer:
 *   post:
 *     summary: Transfer student
 *     tags: [School - Students]
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
 *         description: Student transferred
 */
router.post('/:id/transfer', requireSchoolAdmin, studentsController.transferStudent);

/**
 * @swagger
 * /school/students/id-cards/generate:
 *   post:
 *     summary: Generate student ID cards
 *     tags: [School - Students]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentIds:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: ID cards generated
 */
router.post('/id-cards/generate', requireSchoolAdmin, studentsController.generateIDCards);



module.exports = router;
