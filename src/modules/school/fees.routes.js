const express = require('express');
const router = express.Router();
const feesController = require('./fees.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');
const { requireSchoolAdmin, requireTeacherOrAdmin, SCHOOL_ROLES } = require('../../middleware/permission.middleware');

// Authentication handled at parent router level

/**
 * @swagger
 * /school/structures:
 *   get:
 *     summary: Get all structures
 *     tags: [School - Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/', requireTeacherOrAdmin, feesController.getAllFeeStructures); // Alias for root
router.get('/structures', requireTeacherOrAdmin, feesController.getAllFeeStructures);
/**
 * @swagger
 * /school/structures:
 *   post:
 *     summary: Create structures
 *     tags: [School - Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/structures', requireSchoolAdmin, feesController.createFeeStructure);
/**
 * @swagger
 * /school/invoices/generate:
 *   post:
 *     summary: Create invoices
 *     tags: [School - Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/invoices/generate', requireSchoolAdmin, feesController.generateInvoices);
/**
 * @swagger
 * /school/student/:studentId/invoices:
 *   get:
 *     summary: Get student by ID
 *     tags: [School - Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/invoices', requireTeacherOrAdmin, feesController.getAllInvoices);
router.get('/student/:studentId/invoices', feesController.getStudentInvoices);
router.post('/payments/record', requireSchoolAdmin, feesController.recordPayment);
router.post('/collect', requireSchoolAdmin, feesController.recordPayment); // Alias for frontend compatibility
/**
 * @swagger
 * /school/payments/online:
 *   post:
 *     summary: Create payments
 *     tags: [School - Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/payments/online', feesController.processOnlinePayment);
router.get('/defaulters', requireTeacherOrAdmin, feesController.getFeeDefaulters);
/**
 * @swagger
 * /school/reminders/send:
 *   post:
 *     summary: Create reminders
 *     tags: [School - Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/reminders/send', requireSchoolAdmin, feesController.sendPaymentReminders);
/**
 * @swagger
 * /school/collection-report:
 *   get:
 *     summary: Get all collection-report
 *     tags: [School - Fees]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/collection-report', requireSchoolAdmin, feesController.getCollectionReport);
router.get('/reports', requireSchoolAdmin, feesController.getCollectionReport);
router.get('/payments/:paymentId/receipt', feesController.generateReceipt);

module.exports = router;
