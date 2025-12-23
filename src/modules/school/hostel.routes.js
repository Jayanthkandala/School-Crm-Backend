const express = require('express');
const router = express.Router();
const hostelController = require('./hostel.controller');
const { requireSchoolRole } = require('../../middleware/permission.middleware');

// Routes mounted in school.routes.js are already authenticated.

/**
 * @swagger
 * tags:
 *   name: School - Hostel
 *   description: Hostel, Room and Allocation management
 */

/**
 * @swagger
 * /school/hostel:
 *   get:
 *     summary: Get all hostels
 *     tags: [School - Hostel]
 *     responses:
 *       200:
 *         description: List of hostels
 *   post:
 *     summary: Create a hostel
 *     tags: [School - Hostel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hostelName]
 *             properties:
 *               hostelName:
 *                 type: string
 *               hostelType:
 *                 type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Hostel created
 */
// Hostels
router.get('/', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'), hostelController.getAllHostels);
router.post('/', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL'), hostelController.createHostel);

/**
 * @swagger
 * /school/hostel/{hostelId}/rooms:
 *   get:
 *     summary: Get rooms in a hostel
 *     tags: [School - Hostel]
 *     parameters:
 *       - in: path
 *         name: hostelId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of rooms
 */
// Rooms
router.get('/:hostelId/rooms', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER'), hostelController.getHostelRooms);

/**
 * @swagger
 * /school/hostel/rooms:
 *   post:
 *     summary: Add a room to a hostel
 *     tags: [School - Hostel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [hostelId, roomNumber, capacity]
 *             properties:
 *               hostelId:
 *                 type: string
 *               roomNumber:
 *                 type: string
 *               capacity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Room added
 */
router.post('/rooms', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL'), hostelController.addRoom);

/**
 * @swagger
 * /school/hostel/allocate:
 *   post:
 *     summary: Allocate a room to a student
 *     tags: [School - Hostel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [roomId, studentId]
 *             properties:
 *               roomId:
 *                 type: string
 *               studentId:
 *                 type: string
 *     responses:
 *       200:
 *         description: Room allocated
 */
// Allocations
router.post('/allocate', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL'), hostelController.allocateRoom);

/**
 * @swagger
 * /school/hostel/student/{studentId}:
 *   get:
 *     summary: Get hostel allocation for a student
 *     tags: [School - Hostel]
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *     responses:
 *       200:
 *         description: Allocation details
 */
router.get('/student/:studentId', requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'TEACHER', 'PARENT', 'STUDENT'), hostelController.getStudentAllocation);

module.exports = router;
