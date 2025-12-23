const express = require('express');
const router = express.Router();
const timetableController = require('./timetable.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/class/:classId:
 *   get:
 *     summary: Get class by ID
 *     tags: [School - Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/class/:classId', requireTeacherOrAdmin, timetableController.getClassTimetable);
/**
 * @swagger
 * /school/:
 *   post:
 *     summary: Create resource
 *     tags: [School - Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/', requireSchoolAdmin, timetableController.createTimetableEntry);
/**
 * @swagger
 * /school/:id:
 *   put:
 *     summary: Update :id
 *     tags: [School - Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/:id', requireSchoolAdmin, timetableController.updateTimetableEntry);
/**
 * @swagger
 * /school/:id:
 *   delete:
 *     summary: Delete :id
 *     tags: [School - Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/:id', requireSchoolAdmin, timetableController.deleteTimetableEntry);
/**
 * @swagger
 * /school/bulk:
 *   post:
 *     summary: Create bulk
 *     tags: [School - Timetable]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/bulk', requireSchoolAdmin, timetableController.bulkCreateTimetable);

module.exports = router;
