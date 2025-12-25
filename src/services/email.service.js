const nodemailer = require('nodemailer');
const emailTemplates = require('../utils/emailTemplates');
const { PrismaClient } = require('.prisma/client-platform');
const prisma = new PrismaClient();

let cachedTransporter = null;

const getTransporter = async () => {
    // 1. Try Cached Transporter
    if (cachedTransporter) return cachedTransporter;

    // 2. Try Environment Variables
    if (process.env.SMTP_HOST && process.env.SMTP_USER) {
        cachedTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT || '587'),
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            tls: { rejectUnauthorized: false }
        });
        return cachedTransporter;
    }

    // 3. Try Database Settings
    try {
        const settings = await prisma.systemSetting.findMany({
            where: {
                settingKey: {
                    in: ['SMTP_HOST', 'SMTP_PORT', 'SMTP_USER', 'SMTP_PASS', 'SMTP_FROM']
                }
            }
        });

        const config = {};
        settings.forEach(s => config[s.settingKey] = s.settingValue);

        if (config.SMTP_HOST && config.SMTP_USER) {
            cachedTransporter = nodemailer.createTransport({
                host: config.SMTP_HOST,
                port: parseInt(config.SMTP_PORT || '587'),
                secure: false,
                auth: {
                    user: config.SMTP_USER,
                    pass: config.SMTP_PASS,
                },
                tls: { rejectUnauthorized: false }
            });
            // Store sender globally for use in sendMail
            global.SMTP_FROM_DB = config.SMTP_FROM;
            return cachedTransporter;
        }
    } catch (error) {
        console.error('Failed to load SMTP settings from DB:', error);
    }

    throw new Error('SMTP configuration missing in both ENV and DB');
};

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

        const transporter = await getTransporter();
        const html = emailTemplates[template](data);

        const fromAddress = process.env.SMTP_FROM || global.SMTP_FROM_DB || '"School CRM" <no-reply@crm.com>';

        const info = await transporter.sendMail({
            from: fromAddress,
            to,
            subject,
            html,
        });

        console.log('Message sent: %s', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Send Email Error:', error);
        // Do not crash, but return error
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendEmail,
};
