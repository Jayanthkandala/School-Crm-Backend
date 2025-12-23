const express = require('express');
const router = express.Router();
const teachersController = require('./teachers.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin, requireSchoolRole } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/teachers:
 *   get:
 *     summary: Get all teachers
 *     tags: [School - Teachers]
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
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, ON_LEAVE, RESIGNED]
 *     responses:
 *       200:
 *         description: List of teachers
 */
router.get('/', requireTeacherOrAdmin, teachersController.getAllTeachers);

/**
 * @swagger
 * /school/teachers/stats:
 *   get:
 *     summary: Get teacher statistics
 *     tags: [School - Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher statistics
 */
router.get('/stats', requireTeacherOrAdmin, teachersController.getTeacherStats);

/**
 * @swagger
 * /school/teachers/my/classes:
 *   get:
 *     summary: Get my assigned classes
 *     tags: [School - Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of classes
 */
router.get('/my/classes', requireSchoolRole('TEACHER'), teachersController.getMyClasses);

/**
 * @swagger
 * /school/teachers/my/students:
 *   get:
 *     summary: Get students in my classes
 *     tags: [School - Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of students
 */
router.get('/my/students', requireSchoolRole('TEACHER'), teachersController.getMyStudents);

/**
 * @swagger
 * /school/teachers/my/timetable:
 *   get:
 *     summary: Get my timetable
 *     tags: [School - Teachers]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: My timetable
 */
router.get('/my/timetable', requireSchoolRole('TEACHER'), teachersController.getMyTimetable);

/**
 * @swagger
 * /school/teachers/{id}:
 *   get:
 *     summary: Get teacher by ID
 *     tags: [School - Teachers]
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
 *         description: Teacher details
 */
router.get('/:id', requireTeacherOrAdmin, teachersController.getTeacherById);

/**
 * @swagger
 * /school/teachers:
 *   post:
 *     summary: Create new teacher
 *     tags: [School - Teachers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - employeeId
 *               - fullName
 *               - email
 *               - joiningDate
 *             properties:
 *               employeeId:
 *                 type: string
 *               fullName:
 *                 type: string
 *               email:
 *                 type: string
 *               joiningDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Teacher created
 */
router.post('/', requireSchoolAdmin, teachersController.createTeacher);

/**
 * @swagger
 * /school/teachers/{id}:
 *   put:
 *     summary: Update teacher
 *     tags: [School - Teachers]
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
 *         description: Teacher updated
 */
router.put('/:id', requireSchoolAdmin, teachersController.updateTeacher);

/**
 * @swagger
 * /school/teachers/{id}:
 *   delete:
 *     summary: Delete teacher
 *     tags: [School - Teachers]
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
 *         description: Teacher deleted
 */
router.delete('/:id', requireSchoolAdmin, teachersController.deleteTeacher);

/**
 * @swagger
 * /school/teachers/{id}/assign-class:
 *   post:
 *     summary: Assign teacher to class
 *     tags: [School - Teachers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               classId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Teacher assigned
 */
router.post('/:id/assign-class', requireSchoolAdmin, teachersController.assignToClass);

/**
 * @swagger
 * /school/teachers/{id}/remove-class:
 *   post:
 *     summary: Remove teacher from class
 *     tags: [School - Teachers]
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
 *         description: Teacher removed
 */
router.post('/:id/remove-class', requireSchoolAdmin, teachersController.removeFromClass);

/**
 * @swagger
 * /school/teachers/{id}/timetable:
 *   get:
 *     summary: Get teacher's timetable
 *     tags: [School - Teachers]
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
 *         description: Teacher timetable
 */
router.get('/:id/timetable', requireTeacherOrAdmin, teachersController.getTeacherTimetable);

/**
 * @swagger
 * /school/teachers/bulk/import:
 *   post:
 *     summary: Bulk import teachers
 *     tags: [School - Teachers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               teachers:
 *                 type: array
 *                 items:
 *                   type: object
 *     responses:
 *       200:
 *         description: Import results
 */
router.post('/bulk/import', requireSchoolAdmin, teachersController.bulkImportTeachers);



module.exports = router;
