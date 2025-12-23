const express = require('express');
const router = express.Router();
const disciplinaryController = require('./disciplinary.controller');
const { requireSchoolRole } = require('../../middleware/permission.middleware');

// Routes mounted in school.routes.js are already authenticated.

/**
 * @swagger
 * tags:
 *   name: School - Disciplinary
 *   description: Disciplinary actions and records
 */

/**
 * @swagger
 * /school/disciplinary/student/{studentId}:
 *   get:
 *     summary: Get disciplinary records for a student
 *     tags: [School - Disciplinary]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of disciplinary records
 */
router.get('/student/:studentId', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'), disciplinaryController.getStudentDisciplinaryRecords);

/**
 * @swagger
 * /school/disciplinary:
 *   post:
 *     summary: Add a disciplinary action
 *     tags: [School - Disciplinary]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, actionType, reason, severity, actionDate]
 *             properties:
 *               studentId:
 *                 type: string
 *               actionType:
 *                 type: string
 *                 enum: [WARNING, SUSPENSION, EXPULSION, DETENTION, FINE, OTHER]
 *               reason:
 *                 type: string
 *               severity:
 *                 type: string
 *               actionTaken:
 *                 type: string
 *               actionDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Disciplinary record created
 */
router.post('/', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'), disciplinaryController.addDisciplinaryAction);

module.exports = router;
