const { PrismaClient } = require('@prisma/client');
const { ensureTenantSchema } = require('../utils/tenantDb');

const prisma = new PrismaClient();

/**
 * Tenant Validation Middleware
 * Ensures school exists, is active, and user has access
 */
const validateTenant = async (req, res, next) => {
    // console.log('🚀 TENANT MIDDLEWARE CALLED - URL:', req.url, 'Method:', req.method);

    try {
        let tenantId = null;

        // For platform users, allow tenant ID from header or query param
        if (req.user && req.user.isPlatformUser) {
            // Priority: header > query > body
            tenantId = req.headers['x-tenant-id'] ||
                req.query.tenantId ||
                req.body.tenantId;

            if (!tenantId) {
                // If checking platform routes, maybe not needed? 
                // But this middleware is usually applied to school routes.
                // Pass if not strictly required here? No, strict.
                return res.status(400).json({
                    success: false,
                    message: 'Tenant ID required. Please specify via x-tenant-id header or tenantId parameter.',
                });
            }
        } else {
            // For school users, get tenant ID from JWT token
            if (!req.user || !req.user.tenantId) {
                console.log('❌ Tenant middleware - REJECTING: No req.user or tenantId');
                return res.status(403).json({
                    success: false,
                    message: 'Tenant information missing. Invalid access.',
                });
            }
            tenantId = req.user.tenantId;
        }

        // Verify school exists and is active
        const school = await prisma.school.findUnique({
            where: { id: tenantId },
            select: {
                id: true,
                schoolName: true,
                status: true,
                subdomain: true,
            },
        });

        if (!school) {
            return res.status(404).json({
                success: false,
                message: 'School not found.',
            });
        }

        if (school.status !== 'ACTIVE' && school.status !== 'TRIAL') {
            return res.status(403).json({
                success: false,
                message: `School is ${school.status.toLowerCase()}. Access denied.`,
            });
        }

        // Attach school info to request for easy access
        req.tenant = school;
        req.tenantId = school.id; // Ensure tenantId is always set

        next();
    } catch (error) {
        console.error('Tenant validation error:', error);
        return res.status(500).json({
            success: false,
            message: 'Tenant validation failed.',
        });
    }
};

/**
 * Tenant Database Connection Middleware
 * Gets the appropriate database connection for the tenant
 */
const getTenantDatabase = async (req, res, next) => {
    try {
        // tenantId should already be set by validateTenant middleware
        if (!req.tenantId) {
            return res.status(403).json({
                success: false,
                message: 'Tenant information missing.',
            });
        }

        // Initialize/Ensure schema exists for this tenant
        // This handles the "wiring" logic dynamically
        await ensureTenantSchema(req.tenantId);

        next();
    } catch (error) {
        console.error('Tenant database connection error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to connect to tenant database.',
        });
    }
};

/**
 * Ensure Query Includes Tenant Filter
 * (Deprecated - now using schema isolation)
 */
const addTenantFilter = (whereClause, tenantId) => {
    return whereClause; // No-op since we use schemas
};

module.exports = {
    validateTenant,
    getTenantDatabase,
    addTenantFilter,
};
