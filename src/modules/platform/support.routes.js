const express = require('express');
const router = express.Router();
const supportController = require('./support.controller');
const { authenticatePlatformUser, authenticateSchoolUser } = require('../../middleware/auth.middleware');

/**
 * @swagger
 * /platform/support/tickets:
 *   post:
 *     summary: Create support ticket (School users)
 *     tags: [Platform - Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *               - category
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [LOW, MEDIUM, HIGH, URGENT]
 *               category:
 *                 type: string
 *                 enum: [TECHNICAL, BILLING, FEATURE_REQUEST, BUG, GENERAL]
 *     responses:
 *       201:
 *         description: Ticket created
 */
// School users can create tickets
router.post('/tickets', authenticateSchoolUser, supportController.createTicket);

// Platform users can manage tickets
router.use(authenticatePlatformUser);

/**
 * @swagger
 * /platform/support/tickets:
 *   get:
 *     summary: Get all support tickets
 *     tags: [Platform - Support]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of tickets
 */
router.get('/tickets', supportController.getAllTickets);

router.get('/tickets/my-tickets', supportController.getMyTickets);
router.get('/tickets/stats', supportController.getStats);
router.get('/tickets/:id', supportController.getTicketById);
router.put('/tickets/:id', supportController.updateTicket);
router.post('/tickets/:id/assign', supportController.assignTicket);
router.post('/tickets/:id/respond', supportController.addResponse);
router.put('/tickets/:id/status', supportController.changeStatus);
router.post('/tickets/:id/close', supportController.closeTicket);

module.exports = router;
