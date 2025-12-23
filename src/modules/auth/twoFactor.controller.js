const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const { PrismaClient } = require('@prisma/client');
const { getTenantPrismaClient } = require('../../utils/tenantDb');

/**
 * Enable 2FA for user
 */
const enable2FA = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const db = tenantId ? getTenantPrismaClient(tenantId) : new PrismaClient();

        // Generate secret
        const secret = speakeasy.generateSecret({
            name: `School CRM (${req.user.email})`,
            length: 32,
        });

        // Generate QR code
        const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);

        // Save secret to database (temporarily, until verified)
        await db.user.update({
            where: { id: userId },
            data: {
                twoFactorSecret: secret.base32,
                twoFactorEnabled: false, // Not enabled until verified
            },
        });

        res.json({
            success: true,
            data: {
                secret: secret.base32,
                qrCode: qrCodeUrl,
                manualEntry: secret.base32,
            },
        });
    } catch (error) {
        console.error('Enable 2FA error:', error);
        res.status(500).json({ success: false, message: 'Failed to enable 2FA' });
    }
};

/**
 * Verify and activate 2FA
 */
const verify2FA = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { token } = req.body;
        const db = tenantId ? getTenantPrismaClient(tenantId) : new PrismaClient();

        const user = await db.user.findUnique({
            where: { id: userId },
        });

        if (!user.twoFactorSecret) {
            return res.status(400).json({
                success: false,
                message: '2FA not initialized. Please enable 2FA first.',
            });
        }

        // Verify token
        const verified = speakeasy.totp.verify({
            secret: user.twoFactorSecret,
            encoding: 'base32',
            token,
            window: 2, // Allow 2 time steps before/after
        });

        if (!verified) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code',
            });
        }

        // Generate backup codes
        const backupCodes = [];
        for (let i = 0; i < 10; i++) {
            backupCodes.push(
                Math.random().toString(36).substring(2, 10).toUpperCase()
            );
        }

        // Enable 2FA
        await db.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true,
                backupCodes: JSON.stringify(backupCodes),
            },
        });

        res.json({
            success: true,
            message: '2FA enabled successfully',
            data: {
                backupCodes,
            },
        });
    } catch (error) {
        console.error('Verify 2FA error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify 2FA' });
    }
};

/**
 * Disable 2FA
 */
const disable2FA = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { password } = req.body;
        const db = tenantId ? getTenantPrismaClient(tenantId) : new PrismaClient();
        const bcrypt = require('bcryptjs');

        const user = await db.user.findUnique({
            where: { id: userId },
        });

        // Verify password
        const validPassword = await bcrypt.compare(password, user.passwordHash);
        if (!validPassword) {
            return res.status(401).json({
                success: false,
                message: 'Invalid password',
            });
        }

        // Disable 2FA
        await db.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: false,
                twoFactorSecret: null,
                backupCodes: null,
            },
        });

        res.json({
            success: true,
            message: '2FA disabled successfully',
        });
    } catch (error) {
        console.error('Disable 2FA error:', error);
        res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
    }
};

/**
 * Verify 2FA token during login
 */
const verify2FALogin = async (req, res) => {
    try {
        const { email, token, backupCode } = req.body;
        const { tenantId } = req.body; // Optional for school users
        const db = tenantId ? getTenantPrismaClient(tenantId) : new PrismaClient();

        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user || !user.twoFactorEnabled) {
            return res.status(400).json({
                success: false,
                message: '2FA not enabled for this user',
            });
        }

        let verified = false;

        // Check backup code first
        if (backupCode) {
            const backupCodes = JSON.parse(user.backupCodes || '[]');
            if (backupCodes.includes(backupCode)) {
                verified = true;

                // Remove used backup code
                const updatedCodes = backupCodes.filter(code => code !== backupCode);
                await db.user.update({
                    where: { id: user.id },
                    data: { backupCodes: JSON.stringify(updatedCodes) },
                });
            }
        } else if (token) {
            // Verify TOTP token
            verified = speakeasy.totp.verify({
                secret: user.twoFactorSecret,
                encoding: 'base32',
                token,
                window: 2,
            });
        }

        if (!verified) {
            return res.status(401).json({
                success: false,
                message: 'Invalid 2FA code',
            });
        }

        // Generate JWT token
        const jwt = require('jsonwebtoken');
        const jwtToken = jwt.sign(
            {
                id: user.id,
                email: user.email,
                role: user.role,
                tenantId: tenantId || null,
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
        );

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                token: jwtToken,
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        console.error('2FA login error:', error);
        res.status(500).json({ success: false, message: 'Failed to verify 2FA' });
    }
};

/**
 * Get 2FA status
 */
const get2FAStatus = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const db = tenantId ? getTenantPrismaClient(tenantId) : new PrismaClient();

        const user = await db.user.findUnique({
            where: { id: userId },
            select: {
                twoFactorEnabled: true,
                backupCodes: true,
            },
        });

        const backupCodes = JSON.parse(user.backupCodes || '[]');

        res.json({
            success: true,
            data: {
                enabled: user.twoFactorEnabled,
                backupCodesRemaining: backupCodes.length,
            },
        });
    } catch (error) {
        console.error('Get 2FA status error:', error);
        res.status(500).json({ success: false, message: 'Failed to get 2FA status' });
    }
};

module.exports = {
    enable2FA,
    verify2FA,
    disable2FA,
    verify2FALogin,
    get2FAStatus,
};
