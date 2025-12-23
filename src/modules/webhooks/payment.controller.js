const { PrismaClient } = require('@prisma/client');
const crypto = require('crypto');
const prisma = new PrismaClient();

/**
 * Stripe Payment Webhook
 */
const stripeWebhook = async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.warn('Stripe webhook secret not configured');
            return res.json({ success: true, message: 'Webhook secret not configured' });
        }

        // Verify Stripe signature
        const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

        let event;
        try {
            event = stripe.webhooks.constructEvent(
                req.body,
                signature,
                webhookSecret
            );
        } catch (err) {
            console.error('Stripe signature verification failed:', err.message);
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        // Handle different event types
        switch (event.type) {
            case 'payment_intent.succeeded':
                const paymentIntent = event.data.object;

                // Update payment status in database
                await prisma.payment.updateMany({
                    where: { transactionId: paymentIntent.id },
                    data: {
                        status: 'COMPLETED',
                        paidAt: new Date()
                    }
                });

                console.log('Stripe payment succeeded:', paymentIntent.id);
                break;

            case 'payment_intent.payment_failed':
                const failedPayment = event.data.object;

                // Update payment status to failed
                await prisma.payment.updateMany({
                    where: { transactionId: failedPayment.id },
                    data: {
                        status: 'FAILED'
                    }
                });

                console.log('Stripe payment failed:', failedPayment.id);
                break;

            default:
                console.log('Unhandled Stripe event type:', event.type);
        }

        res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(400).json({
            success: false,
            message: 'Webhook processing failed'
        });
    }
};

/**
 * Razorpay Payment Webhook
 */
const razorpayWebhook = async (req, res) => {
    try {
        const signature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (!webhookSecret) {
            console.warn('Razorpay webhook secret not configured');
            return res.json({ success: true, message: 'Webhook secret not configured' });
        }

        // Verify Razorpay signature
        const expectedSignature = crypto
            .createHmac('sha256', webhookSecret)
            .update(JSON.stringify(req.body))
            .digest('hex');

        if (signature !== expectedSignature) {
            console.error('Invalid Razorpay signature');
            return res.status(400).json({ success: false, message: 'Invalid signature' });
        }

        // Handle webhook event
        const event = req.body.event;
        const payload = req.body.payload;

        switch (event) {
            case 'payment.captured':
                const paymentId = payload.payment.entity.id;
                const amount = payload.payment.entity.amount / 100; // Convert paise to rupees

                // Update payment status
                await prisma.payment.updateMany({
                    where: { transactionId: paymentId },
                    data: {
                        status: 'COMPLETED',
                        paidAt: new Date()
                    }
                });

                console.log('Razorpay payment captured:', paymentId);
                break;

            case 'payment.failed':
                const failedPaymentId = payload.payment.entity.id;

                // Update payment status to failed
                await prisma.payment.updateMany({
                    where: { transactionId: failedPaymentId },
                    data: {
                        status: 'FAILED'
                    }
                });

                console.log('Razorpay payment failed:', failedPaymentId);
                break;

            default:
                console.log('Unhandled Razorpay event:', event);
        }

        res.json({ success: true, message: 'Webhook processed successfully' });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        res.status(400).json({
            success: false,
            message: 'Webhook processing failed'
        });
    }
};

module.exports = {
    stripeWebhook,
    razorpayWebhook,
};
