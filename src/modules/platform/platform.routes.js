const express = require('express');
const router = express.Router();
const schoolsController = require('./schools.controller');
const subscriptionsController = require('./subscriptions.controller');
const supportRoutes = require('./support.routes');
const ownerRoutes = require('./owner.routes');
const { authenticatePlatformUser } = require('../../middleware/auth.middleware');
const { requirePlatformAdmin, requireOwner } = require('../../middleware/permission.middleware');

// Support routes (has its own auth logic)
router.use('/support', supportRoutes);

// Owner routes (has its own auth logic)
router.use('/owner', ownerRoutes);

// All other platform routes require platform user authentication
router.use(authenticatePlatformUser);

// ============================================
// SCHOOLS
// ============================================

/**
 * @swagger
 * /platform/schools:
 *   get:
 *     summary: Get all schools
 *     tags: [Platform - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, TRIAL, SUSPENDED, CANCELLED]
 *     responses:
 *       200:
 *         description: List of schools
 */
router.get('/schools', requirePlatformAdmin, schoolsController.getAllSchools);

/**
 * @swagger
 * /platform/schools/{id}:
 *   get:
 *     summary: Get school by ID
 *     tags: [Platform - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: School details
 *       404:
 *         description: School not found
 */
router.get('/schools/:id', requirePlatformAdmin, schoolsController.getSchoolById);

/**
 * @swagger
 * /platform/schools:
 *   post:
 *     summary: Create new school
 *     tags: [Platform - Schools]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - schoolName
 *               - subdomain
 *               - adminName
 *               - adminEmail
 *               - adminPhone
 *             properties:
 *               schoolName:
 *                 type: string
 *               subdomain:
 *                 type: string
 *               adminName:
 *                 type: string
 *               adminEmail:
 *                 type: string
 *               adminPhone:
 *                 type: string
 *               subscriptionPlanId:
 *                 type: string
 *     responses:
 *       201:
 *         description: School created
 */
router.post('/schools', requirePlatformAdmin, schoolsController.createSchool);

/**
 * @swagger
 * /platform/schools/{id}:
 *   put:
 *     summary: Update school
 *     tags: [Platform - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: School updated
 */
router.put('/schools/:id', requirePlatformAdmin, schoolsController.updateSchool);

/**
 * @swagger
 * /platform/schools/{id}/suspend:
 *   post:
 *     summary: Suspend school
 *     tags: [Platform - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: School suspended
 */
router.post('/schools/:id/suspend', requirePlatformAdmin, schoolsController.suspendSchool);

/**
 * @swagger
 * /platform/schools/{id}/activate:
 *   post:
 *     summary: Activate school
 *     tags: [Platform - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: School activated
 */
router.post('/schools/:id/activate', requirePlatformAdmin, schoolsController.activateSchool);

/**
 * @swagger
 * /platform/schools/{id}:
 *   delete:
 *     summary: Delete school
 *     tags: [Platform - Schools]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: School deleted
 */
router.delete('/schools/:id', requireOwner, schoolsController.deleteSchool);

// ============================================
// ANALYTICS
// ============================================

/**
 * @swagger
 * /platform/analytics:
 *   get:
 *     summary: Get platform analytics
 *     tags: [Platform - Analytics]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform analytics
 */
router.get('/analytics', requirePlatformAdmin, schoolsController.getPlatformAnalytics);

// ============================================
// SUBSCRIPTION PLANS
// ============================================

/**
 * @swagger
 * /platform/subscription-plans:
 *   get:
 *     summary: Get all subscription plans
 *     tags: [Platform - Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of subscription plans
 */
router.get('/subscription-plans', subscriptionsController.getAllPlans);

/**
 * @swagger
 * /platform/subscription-plans:
 *   post:
 *     summary: Create subscription plan
 *     tags: [Platform - Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       201:
 *         description: Plan created
 */
router.post('/subscription-plans', requireOwner, subscriptionsController.createPlan);

/**
 * @swagger
 * /platform/subscription-plans/{id}:
 *   put:
 *     summary: Update subscription plan
 *     tags: [Platform - Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Plan updated
 */
router.put('/subscription-plans/:id', requireOwner, subscriptionsController.updatePlan);

/**
 * @swagger
 * /platform/subscription-plans/{id}:
 *   delete:
 *     summary: Delete subscription plan
 *     tags: [Platform - Subscriptions]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Plan deleted
 */
router.delete('/subscription-plans/:id', requireOwner, subscriptionsController.deletePlan);

module.exports = router;
