const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// We'll use dynamic import or just standard Twilio SDK if available in package.json.
// For now, assuming twilio might not be installed, we will wrap it safely.

let cachedTwilioClient = null;
let cachedFromNumber = null;

const getTwilioClient = async () => {
    if (cachedTwilioClient) return { client: cachedTwilioClient, from: cachedFromNumber };

    // 1. Try ENV
    let accountSid = process.env.TWILIO_ACCOUNT_SID || process.env.SMS_ACCOUNT_SID;
    let authToken = process.env.TWILIO_AUTH_TOKEN || process.env.SMS_AUTH_TOKEN;
    let fromNumber = process.env.TWILIO_FROM_NUMBER || process.env.SMS_FROM_NUMBER;

    // 2. Try DB
    if (!accountSid || !authToken) {
        try {
            const settings = await prisma.systemSetting.findMany({
                where: {
                    settingKey: {
                        in: ['SMS_ACCOUNT_SID', 'SMS_AUTH_TOKEN', 'SMS_FROM_NUMBER']
                    }
                }
            });
            const config = {};
            settings.forEach(s => config[s.settingKey] = s.settingValue);

            accountSid = config.SMS_ACCOUNT_SID;
            authToken = config.SMS_AUTH_TOKEN;
            fromNumber = config.SMS_FROM_NUMBER;
        } catch (error) {
            console.error('Failed to load SMS settings from DB:', error);
        }
    }

    // 3. Fallback: Mock Mode (Free/Dev)
    if (!accountSid || !authToken) {
        console.log('⚠️ No SMS credentials found. Using MOCK SMS mode (Console Log only).');
        return { client: null, from: null, mock: true };
    }

    if (accountSid && authToken) {
        try {
            const twilio = require('twilio');
            cachedTwilioClient = twilio(accountSid, authToken);
            cachedFromNumber = fromNumber;
            return { client: cachedTwilioClient, from: cachedFromNumber, mock: false };
        } catch (err) {
            console.error('Twilio package not installed. Please install it using: npm install twilio');
            throw new Error('Twilio package missing');
        }
    }

    return { client: null, from: null, mock: true };
};

const sendSMS = async ({ to, message }) => {
    try {
        const { client, from, mock } = await getTwilioClient();

        if (mock) {
            console.log(`[MOCK SMS] 📱 To: ${to}`);
            console.log(`[MOCK SMS] 💬 Message: ${message}`);
            return { success: true, sid: 'MOCK-SID-' + Date.now(), mock: true };
        }

        if (!client) {
            throw new Error('Twilio client not initialized');
        }

        const response = await client.messages.create({
            body: message,
            from: from || '+15005550006', // Twilio Test Number
            to: to
        });

        console.log(`SMS sent to ${to}: ${response.sid}`);
        return { success: true, sid: response.sid };
    } catch (error) {
        console.error('Send SMS Error:', error);
        // Fallback for "Free/Dev" mode if no keys:
        console.log(`[MOCK SMS] To: ${to}, Message: ${message}`);
        return { success: false, error: error.message };
    }
};

module.exports = {
    sendSMS
};
