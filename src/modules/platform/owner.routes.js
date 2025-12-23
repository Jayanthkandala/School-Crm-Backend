const express = require('express');
const router = express.Router();
const ownerController = require('./owner.controller');
const moduleManagement = require('./moduleManagement.controller');
const { authenticatePlatformUser } = require('../../middleware/auth.middleware');

// Middleware to ensure only OWNER role can access
const requireOwner = (req, res, next) => {
    if (req.user.role !== 'OWNER') {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Owner role required.',
        });
    }
    next();
};

// All routes require platform authentication and owner role
router.use(authenticatePlatformUser);
router.use(requireOwner);

// ===== DASHBOARD =====
router.get('/dashboard', ownerController.getOwnerDashboard);

// ===== SCHOOL MANAGEMENT =====
router.get('/schools', ownerController.getAllSchools);
router.get('/schools/:schoolId/data', ownerController.accessSchoolData);
router.post('/schools/:schoolId/manage', ownerController.manageSchool);
router.put('/schools/:schoolId/subscription', ownerController.updateSchoolSubscription);

// ===== MODULE MANAGEMENT =====
router.get('/modules', moduleManagement.getAllModules);
router.get('/modules/stats', moduleManagement.getModuleStats);
router.get('/schools/:schoolId/modules', moduleManagement.getSchoolModules);
router.put('/schools/:schoolId/modules', moduleManagement.updateSchoolModules);
router.post('/schools/:schoolId/modules/:moduleName/enable', moduleManagement.enableModule);
router.post('/schools/:schoolId/modules/:moduleName/disable', moduleManagement.disableModule);
router.post('/modules/bulk-update', moduleManagement.bulkUpdateModules);


// ===== FINANCIAL =====
router.get('/invoices', ownerController.getAllInvoices);

// ===== SUPPORT =====
router.get('/tickets', ownerController.getAllTickets);

// ===== AUDIT & MONITORING =====
router.get('/audit-logs', ownerController.getAuditLogs);

// ===== ADVANCED =====
router.post('/schools/:schoolId/query', ownerController.executeCustomQuery);

module.exports = router;
