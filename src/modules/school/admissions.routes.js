const express = require('express');
const router = express.Router();
const admissionsController = require('./admissions.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');
const { optionalAuth } = require('../../middleware/auth.middleware');

/**
 * @swagger
 * /school/admissions/apply:
 *   post:
 *     summary: Submit admission application (Public)
 *     tags: [School - Admissions]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - studentName
 *               - dateOfBirth
 *               - gender
 *               - classAppliedFor
 *               - phone
 *             properties:
 *               studentName:
 *                 type: string
 *               dateOfBirth:
 *                 type: string
 *                 format: date
 *               gender:
 *                 type: string
 *                 enum: [MALE, FEMALE, OTHER]
 *               classAppliedFor:
 *                 type: string
 *               fatherName:
 *                 type: string
 *               motherName:
 *                 type: string
 *               phone:
 *                 type: string
 *               email:
 *                 type: string
 *               address:
 *                 type: string
 *               aadhaarNumber:
 *                 type: string
 *                 description: Aadhaar number (India)
 *               category:
 *                 type: string
 *                 enum: [GENERAL, OBC, SC, ST, EWS]
 *                 description: Category (India)
 *     responses:
 *       201:
 *         description: Application submitted
 */
// Public route - no auth required for application submission
router.post('/apply', optionalAuth, admissionsController.createApplication);
router.post('/', requireTeacherOrAdmin, admissionsController.createApplication); // Admin manual entry

// All other routes require authentication
// Authentication handled at parent router level

/**
 * @swagger
 * /school/admissions:
 *   get:
 *     summary: Get all admission applications
 *     tags: [School - Admissions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, APPROVED, REJECTED]
 *       - in: query
 *         name: academicYear
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of applications
 */
router.get('/', requireTeacherOrAdmin, admissionsController.getAllApplications);

router.get('/stats', requireSchoolAdmin, admissionsController.getAdmissionStats);
router.get('/:id', requireTeacherOrAdmin, admissionsController.getApplicationById);
router.put('/:id', requireSchoolAdmin, admissionsController.updateApplication);
router.post('/:id/approve', requireSchoolAdmin, admissionsController.approveApplication);
router.post('/:id/reject', requireSchoolAdmin, admissionsController.rejectApplication);
router.post('/:id/documents', admissionsController.uploadDocuments);
router.post('/:id/schedule-interview', requireSchoolAdmin, admissionsController.scheduleInterview);

module.exports = router;
