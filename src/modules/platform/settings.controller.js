const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Get all system settings
const getSettings = async (req, res) => {
    try {
        const settings = await prisma.systemSetting.findMany({
            orderBy: { category: 'asc' }
        });

        // Convert array to object for easier frontend consumption
        const settingsMap = {};
        settings.forEach(s => {
            settingsMap[s.settingKey] = s.settingValue;
        });

        res.json({ success: true, data: { settings: settingsMap, raw: settings } });
    } catch (error) {
        console.error('getSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
};

// Update system settings
const updateSettings = async (req, res) => {
    try {
        const { settings } = req.body; // Expect object { key: value }

        if (!settings || typeof settings !== 'object') {
            return res.status(400).json({ success: false, message: 'Invalid settings data' });
        }

        const updates = [];

        // Process each setting
        for (const [key, value] of Object.entries(settings)) {
            // Determine category based on key prefix
            let category = 'general';
            if (key.startsWith('SMTP_')) category = 'email';
            if (key.startsWith('RAZORPAY_')) category = 'payment';
            if (key.startsWith('SMS_')) category = 'sms';

            // Upsert
            const update = prisma.systemSetting.upsert({
                where: { settingKey: key },
                update: {
                    settingValue: String(value),
                    updatedBy: req.user.id
                },
                create: {
                    settingKey: key,
                    settingValue: String(value),
                    category,
                    updatedBy: req.user.id
                }
            });
            updates.push(update);
        }

        await prisma.$transaction(updates);

        res.json({ success: true, message: 'Settings updated successfully' });
    } catch (error) {
        console.error('updateSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
};

module.exports = {
    getSettings,
    updateSettings
};
