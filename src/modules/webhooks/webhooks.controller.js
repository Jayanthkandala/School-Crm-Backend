const crypto = require('crypto');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const handleRazorpayWebhook = async (req, res) => {
    try {
        const { event, payload } = req.body;

        // Verify Razorpay signature
        const signature = req.headers['x-razorpay-signature'];
        const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

        if (webhookSecret) {
            const expectedSignature = crypto
                .createHmac('sha256', webhookSecret)
                .update(JSON.stringify(req.body))
                .digest('hex');

            if (signature !== expectedSignature) {
                console.error('Invalid Razorpay signature');
                return res.status(400).json({ success: false, message: 'Invalid signature' });
            }
        }

        if (event === 'payment.captured') {
            const paymentId = payload.payment.entity.id;
            const orderId = payload.payment.entity.order_id;
            const amount = payload.payment.entity.amount / 100; // Convert paise to rupees

            // Update payment status in platform database
            await prisma.payment.updateMany({
                where: { transactionId: paymentId },
                data: {
                    status: 'COMPLETED',
                    paidAt: new Date()
                }
            });

            console.log('Payment captured and updated:', paymentId);
        }

        res.json({ success: true });
    } catch (error) {
        console.error('Razorpay webhook error:', error);
        res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
};

const handleStripeWebhook = async (req, res) => {
    try {
        const signature = req.headers['stripe-signature'];
        const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

        // Verify Stripe signature
        if (webhookSecret) {
            const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

            try {
                const event = stripe.webhooks.constructEvent(
                    req.body,
                    signature,
                    webhookSecret
                );

                if (event.type === 'payment_intent.succeeded') {
                    const paymentIntent = event.data.object;

                    // Update payment status
                    await prisma.payment.updateMany({
                        where: { transactionId: paymentIntent.id },
                        data: {
                            status: 'COMPLETED',
                            paidAt: new Date()
                        }
                    });

                    console.log('Payment succeeded and updated:', paymentIntent.id);
                }

                res.json({ success: true });
            } catch (err) {
                console.error('Stripe signature verification failed:', err.message);
                return res.status(400).json({ success: false, message: 'Invalid signature' });
            }
        } else {
            // Fallback if no webhook secret configured
            const { type, data } = req.body;

            if (type === 'payment_intent.succeeded') {
                console.log('Payment succeeded:', data);
            }

            res.json({ success: true });
        }
    } catch (error) {
        console.error('Stripe webhook error:', error);
        res.status(500).json({ success: false, message: 'Webhook processing failed' });
    }
};

module.exports = {
    handleRazorpayWebhook,
    handleStripeWebhook,
};
