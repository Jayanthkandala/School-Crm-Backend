const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

/**
 * Authentication Middleware
 * Verifies JWT token and attaches user to request
 */
const authenticate = async (req, res, next) => {


    try {
        // Get token from header
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                message: 'Access denied. No token provided.',
            });
        }

        const token = authHeader.substring(7); // Remove 'Bearer ' prefix

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Debug logging
        console.log('🔍 Decoded JWT token:', {
            userId: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            tenantId: decoded.tenantId,
            isPlatformUser: decoded.isPlatformUser
        });

        // Check if token is expired
        if (decoded.exp && Date.now() >= decoded.exp * 1000) {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
            });
        }

        // Attach user info to request
        req.user = {
            id: decoded.userId,
            email: decoded.email,
            role: decoded.role,
            tenantId: decoded.tenantId, // For school users
            isPlatformUser: decoded.isPlatformUser || false,
        };



        console.log('✅ req.user set:', req.user);

        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token.',
            });
        }

        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({
                success: false,
                message: 'Token expired. Please login again.',
            });
        }

        return res.status(500).json({
            success: false,
            message: 'Authentication failed.',
            error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        });
    }
};

/**
 * Platform User Authentication
 * Only allows platform users (CRM owners/staff)
 */
const authenticatePlatformUser = async (req, res, next) => {
    try {
        await authenticate(req, res, async () => {
            if (!req.user.isPlatformUser) {
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. Platform user access required.',
                });
            }

            // Verify user still exists and is active
            const platformUser = await prisma.platformUser.findUnique({
                where: { id: req.user.id },
                select: { id: true, isActive: true, role: true },
            });

            if (!platformUser || !platformUser.isActive) {
                return res.status(403).json({
                    success: false,
                    message: 'User account is inactive or not found.',
                });
            }

            req.user.role = platformUser.role;
            next();
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Authentication failed.',
        });
    }
};

/**
 * School User Authentication
 * Only allows school users (admin, teacher, parent, student)
 */
const authenticateSchoolUser = async (req, res, next) => {
    console.log('🚀 authenticateSchoolUser CALLED for URL:', req.url);
    try {
        await authenticate(req, res, async () => {
            console.log('🏫 authenticateSchoolUser - After authenticate, req.user:', JSON.stringify(req.user, null, 2));

            if (req.user.isPlatformUser) {
                console.log('❌ Rejecting: Platform user trying to access school route');
                return res.status(403).json({
                    success: false,
                    message: 'Access denied. School user access required.',
                });
            }

            // TEMPORARILY COMMENTED OUT FOR DEBUGGING
            // if (!req.user.tenantId) {
            //     console.log('❌ Rejecting: No tenantId in req.user');
            //     console.log('❌ req.user:', req.user);
            //     return res.status(403).json({
            //         success: false,
            //         message: 'Invalid tenant information.',
            //     });
            // }

            console.log('✅ School user authenticated, tenantId:', req.user.tenantId);
            next();
        });
    } catch (error) {
        console.log('❌ authenticateSchoolUser error:', error);
        return res.status(500).json({
            success: false,
            message: 'Authentication failed.',
        });
    }
};

/**
 * Optional Authentication
 * Attaches user if token is present, but doesn't require it
 */
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        await authenticate(req, res, next);
    } catch (error) {
        // If authentication fails, continue without user
        next();
    }
};

module.exports = {
    authenticate,
    authenticatePlatformUser,
    authenticateSchoolUser,
    optionalAuth,
};
