const express = require('express');
const router = express.Router();
const healthController = require('./health.controller');
const { requireSchoolRole } = require('../../middleware/permission.middleware');

// Routes mounted in school.routes.js are already authenticated.
// We only need to check roles.

/**
 * @swagger
 * tags:
 *   name: School - Health
 *   description: Student health records and vaccination management
 */

/**
 * @swagger
 * /school/health/records/{studentId}:
 *   get:
 *     summary: Get health records for a student
 *     tags: [School - Health]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of health records
 */
router.get('/records/:studentId', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'), healthController.getStudentHealthRecords);

/**
 * @swagger
 * /school/health/records:
 *   post:
 *     summary: Add a health record
 *     tags: [School - Health]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, recordDate, recordType]
 *             properties:
 *               studentId:
 *                 type: string
 *               recordDate:
 *                 type: string
 *                 format: date
 *               recordType:
 *                 type: string
 *                 enum: [GENERAL_CHECKUP, DENTAL, EYE, VACCINATION, EMERGENCY, OTHER]
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Health record created
 */
router.post('/records', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'), healthController.addHealthRecord);

/**
 * @swagger
 * /school/health/vaccinations/{studentId}:
 *   get:
 *     summary: Get vaccinations for a student
 *     tags: [School - Health]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of vaccinations
 */
router.get('/vaccinations/:studentId', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'), healthController.getStudentVaccinations);

/**
 * @swagger
 * /school/health/vaccinations:
 *   post:
 *     summary: Add a vaccination record
 *     tags: [School - Health]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [studentId, vaccineName]
 *             properties:
 *               studentId:
 *                 type: string
 *               vaccineName:
 *                 type: string
 *               doseNumber:
 *                 type: integer
 *               administeredOn:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Vaccination record created
 */
router.post('/vaccinations', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'), healthController.addVaccination);

module.exports = router;
