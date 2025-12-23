const express = require('express');
const router = express.Router();
const paymentController = require('./payment.controller');

/**
 * @swagger
 * /webhooks/payment/stripe:
 *   post:
 *     summary: Stripe payment webhook
 *     tags: [Webhooks]
 *     description: Receives payment notifications from Stripe
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/stripe', paymentController.stripeWebhook);

/**
 * @swagger
 * /webhooks/payment/razorpay:
 *   post:
 *     summary: Razorpay payment webhook
 *     tags: [Webhooks]
 *     description: Receives payment notifications from Razorpay
 *     responses:
 *       200:
 *         description: Webhook processed
 */
router.post('/razorpay', paymentController.razorpayWebhook);

module.exports = router;
