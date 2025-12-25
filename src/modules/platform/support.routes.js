const express = require('express');
const router = express.Router();
const supportController = require('./support.controller');
const { authenticatePlatformUser, authenticateSchoolUser } = require('../../middleware/auth.middleware');

console.log('LOADING SUPPORT ROUTES... (KB, Templates enabled)');

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

// Platform users can also create tickets (for testing)
router.post('/tickets/create', authenticatePlatformUser, supportController.createPlatformTicket);

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
router.get('/tickets/search', supportController.searchTickets);
router.get('/tickets/:id', supportController.getTicketById);
router.get('/tickets/:ticketId/sla-status', supportController.checkSLAStatus);

router.put('/tickets/:id', supportController.updateTicket);
router.post('/tickets/:id/assign', supportController.assignTicket);
router.post('/tickets/:id/respond', supportController.addResponse);
router.put('/tickets/:id/status', supportController.changeStatus);
router.post('/tickets/:id/close', supportController.closeTicket);
router.delete('/tickets/:id', supportController.deleteTicket);
router.post('/tickets/:id/escalate', supportController.escalateTicket);
router.post('/tickets/:id/internal-note', supportController.addInternalNote);
router.post('/tickets/:id/rate', supportController.rateTicket);

// Knowledge Base routes
router.get('/kb/articles', supportController.getAllArticles);
router.get('/kb/articles/:id', supportController.getArticleById);
router.post('/kb/articles', supportController.createArticle);
router.put('/kb/articles/:id', supportController.updateArticle);
router.delete('/kb/articles/:id', supportController.deleteArticle);
router.post('/kb/articles/:id/helpful', supportController.markArticleHelpful);

// Template routes
router.get('/templates', supportController.getAllTemplates);
router.post('/templates', supportController.createTemplate);
router.put('/templates/:id', supportController.updateTemplate);
router.delete('/templates/:id', supportController.deleteTemplate);

// SLA routes
router.get('/sla/policies', supportController.getAllSLAPolicies);
router.post('/sla/policies', supportController.createSLAPolicy);

// Support Settings
router.get('/settings', supportController.getSupportSettings);
router.put('/settings', supportController.updateSupportSettings);

module.exports = router;
