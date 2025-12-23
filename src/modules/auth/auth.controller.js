const { PrismaClient } = require('@prisma/client');
const { hashPassword, comparePassword } = require('../../utils/encryption.util');
const { generatePlatformUserTokens, generateSchoolUserTokens, verifyRefreshToken } = require('../../utils/jwt.util');
const { generateOTP } = require('../../utils/encryption.util');
const emailService = require('../../services/email.service');
const { isValidEmail, validatePassword } = require('../../utils/validation.util');
const { recordFailedAttempt, isAccountLocked, resetAttempts } = require('../../utils/accountLockout.util');
const { logAuthEvent, AUDIT_ACTIONS } = require('../../utils/auditLog.util');
const { getTenantPrismaClient, ensureTenantSchema } = require('../../utils/tenantDb');

const prisma = new PrismaClient();

/**
 * Platform User Login
 */
const platformLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate input
        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required',
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        const emailLower = email.toLowerCase();

        // Check if account is locked
        const lockStatus = isAccountLocked(emailLower);
        if (lockStatus.locked) {
            await logAuthEvent(req, AUDIT_ACTIONS.ACCOUNT_LOCKED, null, emailLower, 'FAILED', {
                remainingTime: lockStatus.remainingTime
            });

            return res.status(423).json({
                success: false,
                message: `Account is locked due to multiple failed login attempts. Please try again in ${lockStatus.remainingTime} minutes.`,
                lockUntil: lockStatus.lockUntil
            });
        }

        // Find user
        const user = await prisma.platformUser.findUnique({
            where: { email: emailLower },
        });

        if (!user) {
            // Record failed attempt
            const attemptResult = recordFailedAttempt(emailLower);

            await logAuthEvent(req, AUDIT_ACTIONS.LOGIN_FAILED, null, emailLower, 'FAILED', {
                reason: 'User not found',
                remainingAttempts: attemptResult.remainingAttempts
            });

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                remainingAttempts: attemptResult.remainingAttempts
            });
        }

        // Check if user is active
        if (!user.isActive) {
            await logAuthEvent(req, AUDIT_ACTIONS.LOGIN_FAILED, user.id, user.email, 'FAILED', {
                reason: 'Account deactivated'
            });

            return res.status(403).json({
                success: false,
                message: 'Your account has been deactivated. Please contact support.',
            });
        }

        // Verify password
        const isPasswordValid = await comparePassword(password, user.passwordHash);

        if (!isPasswordValid) {
            // Record failed attempt
            const attemptResult = recordFailedAttempt(emailLower);

            await logAuthEvent(req, AUDIT_ACTIONS.LOGIN_FAILED, user.id, user.email, 'FAILED', {
                reason: 'Invalid password',
                remainingAttempts: attemptResult.remainingAttempts,
                locked: attemptResult.locked
            });

            if (attemptResult.locked) {
                return res.status(423).json({
                    success: false,
                    message: `Account locked due to multiple failed login attempts. Please try again in ${attemptResult.lockoutDuration} minutes.`,
                });
            }

            return res.status(401).json({
                success: false,
                message: 'Invalid email or password',
                remainingAttempts: attemptResult.remainingAttempts
            });
        }

        // Reset login attempts on successful login
        resetAttempts(emailLower);

        // Generate tokens
        const tokens = generatePlatformUserTokens(user);

        // Update last login
        await prisma.platformUser.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        // Log successful login
        await logAuthEvent(req, AUDIT_ACTIONS.LOGIN, user.id, user.email, 'SUCCESS', {
            role: user.role
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                },
                tokens,
            },
        });
    } catch (error) {
        console.error('Platform login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * School User Login
 */
const schoolLogin = async (req, res) => {
    try {
        const { email, password, tenantId } = req.body;

        // Validate input
        if (!email || !password || !tenantId) {
            return res.status(400).json({
                success: false,
                message: 'Email, password, and Tenant ID are required',
            });
        }

        // Find school (mapping tenantId to subdomain)
        const school = await prisma.school.findUnique({
            where: { subdomain: tenantId.toLowerCase() },
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'School not found',
            });
        }

        // Check school status
        if (school.status === 'SUSPENDED') {
            return res.status(403).json({
                success: false,
                message: 'School account is suspended. Please contact support.',
            });
        }

        if (school.status === 'CANCELLED') {
            return res.status(403).json({
                success: false,
                message: 'School account has been cancelled.',
            });
        }

        // Connect to tenant database and verify user
        await ensureTenantSchema(school.id);
        const tenantDb = getTenantPrismaClient(school.id);
        const user = await tenantDb.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        if (!user.isActive) {
            return res.status(403).json({ success: false, message: 'Account is inactive' });
        }

        const isPasswordValid = await comparePassword(password, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const tokens = generateSchoolUserTokens(user, school.id);

        // Debug: Log the token payload
        const jwt = require('jsonwebtoken');
        const decoded = jwt.decode(tokens.accessToken);
        console.log('🔑 Generated JWT payload:', decoded);

        // Update last login
        await tenantDb.user.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
        });

        await logAuthEvent(req, AUDIT_ACTIONS.LOGIN, user.id, user.email, 'SUCCESS', {
            role: user.role,
            schoolId: school.id
        });

        res.json({
            success: true,
            message: 'Login successful',
            data: {
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                    tenantId: school.id,
                    schoolName: school.schoolName
                },
                tokens,
            },
        });
    } catch (error) {
        console.error('School login error:', error);
        res.status(500).json({
            success: false,
            message: 'Login failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Register Platform User (Owner only)
 */
const registerPlatformUser = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Validate input
        if (!fullName || !email || !password || !role) {
            return res.status(400).json({
                success: false,
                message: 'All fields are required',
            });
        }

        // Validate email format
        if (!isValidEmail(email)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid email format',
            });
        }

        // Validate password complexity
        const passwordValidation = validatePassword(password);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message,
            });
        }

        // Check if email already exists
        const existingUser = await prisma.platformUser.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            return res.status(400).json({
                success: false,
                message: 'Email already registered',
            });
        }

        // Hash password
        const passwordHash = await hashPassword(password);

        // Create user
        const user = await prisma.platformUser.create({
            data: {
                fullName,
                email: email.toLowerCase(),
                passwordHash,
                role,
            },
        });

        // Log audit
        await prisma.platformAuditLog.create({
            data: {
                userId: req.user?.id,
                action: 'platform_user_created',
                entityType: 'platform_user',
                entityId: user.id,
                newValues: { fullName, email, role },
                ipAddress: req.ip,
                userAgent: req.get('user-agent'),
            },
        });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            data: {
                user: {
                    id: user.id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                },
            },
        });
    } catch (error) {
        console.error('Register platform user error:', error);
        res.status(500).json({
            success: false,
            message: 'Registration failed',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Refresh Access Token
 */
const refreshToken = async (req, res) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(400).json({
                success: false,
                message: 'Refresh token is required',
            });
        }

        // Verify refresh token
        const decoded = verifyRefreshToken(refreshToken);

        // Generate new tokens
        let tokens;
        if (decoded.isPlatformUser) {
            const user = await prisma.platformUser.findUnique({
                where: { id: decoded.userId },
            });

            if (!user || !user.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'User not found or inactive',
                });
            }

            tokens = generatePlatformUserTokens(user);
        } else {
            // School user token refresh
            tokens = {
                accessToken: 'school-token-pending',
                refreshToken: 'school-refresh-pending',
            };
        }

        res.json({
            success: true,
            message: 'Token refreshed successfully',
            data: { tokens },
        });
    } catch (error) {
        console.error('Refresh token error:', error);
        res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
        });
    }
};

/**
 * Forgot Password
 */
const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({
                success: false,
                message: 'Email is required',
            });
        }

        // Find user
        const user = await prisma.platformUser.findUnique({
            where: { email: email.toLowerCase() },
        });

        // User request: Explicitly say error if email not exists
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'Email address not found in our records',
            });
        }

        // Generate OTP
        const otp = generateOTP(6);
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 mins

        // Store OTP in SystemSetting (avoiding schema changes)
        await prisma.systemSetting.upsert({
            where: { settingKey: `otp:${email.toLowerCase()}` },
            update: {
                settingValue: JSON.stringify({ otp, expiresAt }),
                updatedAt: new Date()
            },
            create: {
                settingKey: `otp:${email.toLowerCase()}`,
                settingValue: JSON.stringify({ otp, expiresAt }),
                category: 'otp'
            }
        });

        // Send email with OTP
        let emailSent = false;
        try {
            await emailService.sendEmail({
                to: email,
                subject: 'Password Reset Request',
                template: 'passwordResetEmail',
                data: {
                    fullName: user.fullName,
                    resetUrl: `http://localhost:5173/reset-password?email=${encodeURIComponent(email)}&code=${otp}`,
                    expiresIn: '15'
                }
            });
            console.log(`Password reset email sent to ${email}`);
            emailSent = true;
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
            // We continue even if email fails, so user can use the returned OTP
        }

        console.log(`DEBUG: Password reset OTP for ${email}: ${otp}`);

        res.json({
            success: true,
            message: emailSent ? 'Password reset link sent to your email' : 'Email failed to send, but OTP generated (see below)',
            otp: otp, // User request: "get otp now because its in local" - Returning explicitly
            emailSent
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to process request',
        });
    }
};

/**
 * Reset Password
 */
const resetPassword = async (req, res) => {
    try {
        const { email, otp, newPassword } = req.body;

        if (!email || !otp || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Email, OTP, and new password are required',
            });
        }

        // Verify OTP from database
        const setting = await prisma.systemSetting.findUnique({
            where: { settingKey: `otp:${email.toLowerCase()}` }
        });

        if (!setting) {
            return res.status(400).json({
                success: false,
                message: 'Invalid or expired OTP',
            });
        }

        const { otp: storedOtp, expiresAt: storedExpiresAt } = JSON.parse(setting.settingValue);

        if (storedOtp !== otp) {
            return res.status(400).json({
                success: false,
                message: 'Invalid OTP',
            });
        }

        if (new Date(storedExpiresAt) < new Date()) {
            return res.status(400).json({
                success: false,
                message: 'OTP has expired',
            });
        }

        // Delete used OTP
        await prisma.systemSetting.delete({
            where: { settingKey: `otp:${email.toLowerCase()}` }
        });

        // Find user
        const user = await prisma.platformUser.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'User not found',
            });
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password
        await prisma.platformUser.update({
            where: { id: user.id },
            data: { passwordHash },
        });

        // Log audit
        // Log audit (non-blocking)
        try {
            await prisma.platformAuditLog.create({
                data: {
                    userId: user.id,
                    action: 'password_reset',
                    entityType: 'platform_user',
                    entityId: user.id,
                    // ipAddress: req.ip, // Safe to omit if causing issues or invalid
                    ipAddress: req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown',
                    userAgent: req.get('user-agent'),
                },
            });
        } catch (logError) {
            console.error('Audit log failed:', logError.message);
            // Continue execution
        }

        res.json({
            success: true,
            message: 'Password reset successful',
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reset password',
        });
    }
};

/**
 * Get Current User
 */
const getCurrentUser = async (req, res) => {
    try {
        if (req.user.isPlatformUser) {
            const user = await prisma.platformUser.findUnique({
                where: { id: req.user.id },
                select: {
                    id: true,
                    fullName: true,
                    email: true,
                    role: true,
                    isActive: true,
                    lastLoginAt: true,
                    createdAt: true,
                },
            });

            return res.json({
                success: true,
                data: { user },
            });
        } else {
            // School user
            return res.json({
                success: true,
                data: {
                    user: {
                        id: req.user.id,
                        email: req.user.email,
                        role: req.user.role,
                        tenantId: req.user.tenantId,
                    },
                },
            });
        }
    } catch (error) {
        console.error('Get current user error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to get user information',
        });
    }
};

/**
 * Logout
 */
const logout = async (req, res) => {
    try {
        // Log audit
        if (req.user.isPlatformUser) {
            await prisma.platformAuditLog.create({
                data: {
                    userId: req.user.id,
                    action: 'platform_user_logout',
                    entityType: 'platform_user',
                    entityId: req.user.id,
                    ipAddress: req.ip,
                    userAgent: req.get('user-agent'),
                },
            });
        }

        // TODO: Invalidate refresh token (store in Redis/DB)

        res.json({
            success: true,
            message: 'Logout successful',
        });
    } catch (error) {
        console.error('Logout error:', error);
        res.status(500).json({
            success: false,
            message: 'Logout failed',
        });
    }
};

/**
 * Update Profile
 */
const updateProfile = async (req, res) => {
    try {
        const { fullName } = req.body;
        const userId = req.user.id; // From middleware

        if (!fullName) {
            return res.status(400).json({
                success: false,
                message: 'Full name is required'
            });
        }

        const user = await prisma.platformUser.update({
            where: { id: userId },
            data: { fullName },
            select: {
                id: true,
                fullName: true,
                email: true,
                role: true,
                isActive: true
            }
        });

        res.json({
            success: true,
            message: 'Profile updated successfully',
            data: { user }
        });
    } catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update profile'
        });
    }
};

/**
 * Change Password
 */
const changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const userId = req.user.id;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({
                success: false,
                message: 'Current password and new password are required'
            });
        }

        // Validate new password complexity
        const passwordValidation = validatePassword(newPassword);
        if (!passwordValidation.valid) {
            return res.status(400).json({
                success: false,
                message: passwordValidation.message,
            });
        }

        // Check if new password is same as current
        if (currentPassword === newPassword) {
            return res.status(400).json({
                success: false,
                message: 'New password must be different from current password'
            });
        }

        // Get user with password hash
        const user = await prisma.platformUser.findUnique({
            where: { id: userId }
        });

        // Verify current password
        const isPasswordValid = await comparePassword(currentPassword, user.passwordHash);
        if (!isPasswordValid) {
            return res.status(401).json({
                success: false,
                message: 'Incorrect current password'
            });
        }

        // Hash new password
        const passwordHash = await hashPassword(newPassword);

        // Update password
        await prisma.platformUser.update({
            where: { id: userId },
            data: { passwordHash }
        });

        // Log password change
        await logAuthEvent(req, AUDIT_ACTIONS.PASSWORD_CHANGED, userId, user.email, 'SUCCESS', {});

        res.json({
            success: true,
            message: 'Password changed successfully'
        });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password'
        });
    }
};

module.exports = {
    platformLogin,
    schoolLogin,
    registerPlatformUser,
    refreshToken,
    forgotPassword,
    resetPassword,
    getCurrentUser,
    logout,
    updateProfile,
    changePassword,
};
