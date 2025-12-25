const express = require('express');
const router = express.Router();
const supportController = require('../platform/support.controller');

// Note: authenticateSchoolUser is applied in the parent router (school.routes.js)

// Create a ticket
router.post('/', supportController.createTicket);

// List tickets for this school
router.get('/', supportController.getSchoolTickets);

// Knowledge Base Access
router.get('/kb', supportController.getAllArticles);
router.get('/kb/:id', supportController.getArticleById);

// Get ticket details
router.get('/:id', supportController.getSchoolTicketById);

// Add a response to a ticket
router.post('/:id/respond', supportController.addResponse);

// Close ticket (optional for school admin?) - Let's allow it.
router.post('/:id/close', async (req, res) => {
    // Wrap to ensure ownership check
    // supportController.closeTicket doesn't check ownership natively yet.
    // For now, let's keep it simple: List, Create, Reply, View.
    // Closing usually done by Support or verified User. 
    // We can add close later if requested.
    res.status(501).json({ message: 'Not implemented' });
});

module.exports = router;
