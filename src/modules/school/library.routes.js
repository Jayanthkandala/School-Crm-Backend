const express = require('express');
const router = express.Router();
const libraryController = require('./library.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin, SCHOOL_ROLES } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/books:
 *   get:
 *     summary: Get all books
 *     tags: [School - Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/books', requireTeacherOrAdmin, libraryController.getAllBooks);
/**
 * @swagger
 * /school/books:
 *   post:
 *     summary: Create books
 *     tags: [School - Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/books', requireSchoolAdmin, libraryController.createBook);
/**
 * @swagger
 * /school/books/:id:
 *   put:
 *     summary: Update books
 *     tags: [School - Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.put('/books/:id', requireSchoolAdmin, libraryController.updateBook);
/**
 * @swagger
 * /school/books/:id:
 *   delete:
 *     summary: Delete books
 *     tags: [School - Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/books/:id', requireSchoolAdmin, libraryController.deleteBook);
/**
 * @swagger
 * /school/issue:
 *   post:
 *     summary: Create issue
 *     tags: [School - Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/issue', requireTeacherOrAdmin, libraryController.issueBook);
/**
 * @swagger
 * /school/return/:transactionId:
 *   post:
 *     summary: Create return
 *     tags: [School - Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/return/:transactionId', requireTeacherOrAdmin, libraryController.returnBook);
/**
 * @swagger
 * /school/renew/:transactionId:
 *   post:
 *     summary: Create renew
 *     tags: [School - Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/renew/:transactionId', requireTeacherOrAdmin, libraryController.renewBook);
/**
 * @swagger
 * /school/reserve:
 *   post:
 *     summary: Create reserve
 *     tags: [School - Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/reserve', libraryController.reserveBook);
router.get('/overdue', requireTeacherOrAdmin, libraryController.getOverdueBooks);
/**
 * @swagger
 * /school/student/:studentId/history:
 *   get:
 *     summary: Get student by ID
 *     tags: [School - Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/student/:studentId/history', requireTeacherOrAdmin, libraryController.getStudentHistory);
/**
 * @swagger
 * /school/stats:
 *   get:
 *     summary: Get all stats
 *     tags: [School - Library]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/stats', requireTeacherOrAdmin, libraryController.getLibraryStats);

module.exports = router;
