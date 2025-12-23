const nodemailer = require('nodemailer');
const emailTemplates = require('../utils/emailTemplates');

// Create transporter
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false, // true for 465, false for other ports
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
    tls: {
        rejectUnauthorized: false
    }
});

// Verify connection
transporter.verify((error, success) => {
    if (error) {
        console.error('SMTP Connection Error:', error);
    } else {
        console.log('SMTP Server Connected Successfully');
    }
});

/**
 * Send email using predefined templates
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.template - Template name from emailTemplates.js
 * @param {Object} options.data - Data to inject into template
 */
const sendEmail = async ({ to, subject, template, data }) => {
    try {
        if (!emailTemplates[template]) {
            throw new Error(`Invalid email template: ${template}`);
        }

        const html = emailTemplates[template](data);

        const info = await transporter.sendMail({
            from: `"${process.env.SMTP_FROM_NAME || 'School CRM'}" <${process.env.SMTP_FROM}>`,
            to,
            subject,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Send Email Error:', error);
        // return { success: false, error: error.message }; // Don't crash app, just return fail
        // In production, you might want to throw error or handle partial failures
        throw error;
    }
};

module.exports = {
    sendEmail,
};
