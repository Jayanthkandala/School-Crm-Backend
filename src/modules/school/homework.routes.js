const express = require('express');
const router = express.Router();
const homeworkController = require('./homework.controller');
const { requireSchoolRole } = require('../../middleware/permission.middleware');

// Routes mounted in school.routes.js are already authenticated.

/**
 * @swagger
 * tags:
 *   name: School - Homework
 *   description: Homework assignment and submission
 */

/**
 * @swagger
 * /school/homework:
 *   post:
 *     summary: Create a homework assignment
 *     tags: [School - Homework]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [classId, subjectId, title, dueDate]
 *             properties:
 *               classId:
 *                 type: string
 *               subjectId:
 *                 type: string
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Homework created
 */
router.post('/', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'), homeworkController.createHomework);

/**
 * @swagger
 * /school/homework/class/{classId}:
 *   get:
 *     summary: Get homework for a class
 *     tags: [School - Homework]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *     responses:
 *       200:
 *         description: List of homework
 */
router.get('/class/:classId', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'), homeworkController.getClassHomework);

/**
 * @swagger
 * /school/homework/submit:
 *   post:
 *     summary: Submit homework (Student)
 *     tags: [School - Homework]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [homeworkId]
 *             properties:
 *               homeworkId:
 *                 type: string
 *               submissionText:
 *                 type: string
 *     responses:
 *       200:
 *         description: Homework submitted
 */
router.post('/submit', requireSchoolRole('STUDENT'), homeworkController.submitHomework);

module.exports = router;
