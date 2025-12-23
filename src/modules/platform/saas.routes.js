const express = require('express');
const router = express.Router();

const onboardingController = require('./onboarding.controller');
const analyticsController = require('./analytics.controller');
const billingController = require('./billing.controller');

const { authenticatePlatformUser } = require('../../middleware/auth.middleware');
const { requirePlatformAdmin, requireOwner } = require('../../middleware/permission.middleware');

// All routes require platform authentication
router.use(authenticatePlatformUser);

// ===== ONBOARDING ROUTES =====
router.post('/onboarding/schools', requireOwner, onboardingController.createSchool);
router.put('/onboarding/schools/:id/suspend', requirePlatformAdmin, onboardingController.suspendSchool);
router.put('/onboarding/schools/:id/activate', requirePlatformAdmin, onboardingController.activateSchool);
router.delete('/onboarding/schools/:id', requireOwner, onboardingController.deleteSchool);

// ===== ANALYTICS ROUTES =====
router.get('/analytics/dashboard', requirePlatformAdmin, analyticsController.getPlatformAnalytics);
router.get('/analytics/revenue', requireOwner, analyticsController.getRevenueAnalytics);
router.get('/analytics/schools/:schoolId/health', requirePlatformAdmin, analyticsController.getSchoolHealth);

// ===== BILLING ROUTES =====
router.post('/billing/invoices/generate', requireOwner, billingController.generateMonthlyInvoices);
router.post('/billing/invoices/:invoiceId/payment', requirePlatformAdmin, billingController.processInvoicePayment);
router.post('/billing/failed-payments', requireOwner, billingController.handleFailedPayments);
router.put('/billing/schools/:schoolId/plan', requirePlatformAdmin, billingController.changeSubscriptionPlan);
router.post('/billing/schools/:schoolId/cancel', requirePlatformAdmin, billingController.cancelSubscription);

module.exports = router;
