/**
 * Permission Middleware
 * Checks if user has required role/permission
 */

const PLATFORM_ROLES = {
    OWNER: 'OWNER',
    ADMIN: 'ADMIN',
    SUPPORT: 'SUPPORT',
    SALES: 'SALES',
    FINANCE: 'FINANCE',
    DEVELOPER: 'DEVELOPER',
};

const SCHOOL_ROLES = {
    SCHOOL_ADMIN: 'SCHOOL_ADMIN',
    PRINCIPAL: 'PRINCIPAL',
    TEACHER: 'TEACHER',
    STUDENT: 'STUDENT',
    PARENT: 'PARENT',
    ACCOUNTANT: 'ACCOUNTANT',
    LIBRARIAN: 'LIBRARIAN',
    RECEPTIONIST: 'RECEPTIONIST',
};

/**
 * Check if user has required platform role
 */
const requirePlatformRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        if (!req.user.isPlatformUser) {
            return res.status(403).json({
                success: false,
                message: 'Platform user access required.',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions.',
                required: allowedRoles,
                current: req.user.role,
            });
        }

        next();
    };
};

/**
 * Check if user has required school role
 */
const requireSchoolRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        if (req.user.isPlatformUser) {
            return res.status(403).json({
                success: false,
                message: 'School user access required.',
            });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions.',
                required: allowedRoles,
                current: req.user.role,
            });
        }

        next();
    };
};

/**
 * Check if user is platform owner
 */
const requireOwner = requirePlatformRole(PLATFORM_ROLES.OWNER);

/**
 * Check if user is platform owner or admin
 */
const requirePlatformAdmin = requirePlatformRole(
    PLATFORM_ROLES.OWNER,
    PLATFORM_ROLES.ADMIN
);

/**
 * Check if user is school admin
 */
const requireSchoolAdmin = requireSchoolRole(SCHOOL_ROLES.SCHOOL_ADMIN, SCHOOL_ROLES.PRINCIPAL);

/**
 * Check if user is teacher or admin
 */
const requireTeacherOrAdmin = requireSchoolRole(
    SCHOOL_ROLES.SCHOOL_ADMIN,
    SCHOOL_ROLES.PRINCIPAL,
    SCHOOL_ROLES.TEACHER
);

/**
 * Custom permission checker
 */
const hasPermission = (permissionCheck) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'Authentication required.',
            });
        }

        const hasAccess = permissionCheck(req.user, req);

        if (!hasAccess) {
            return res.status(403).json({
                success: false,
                message: 'Insufficient permissions for this action.',
            });
        }

        next();
    };
};

module.exports = {
    PLATFORM_ROLES,
    SCHOOL_ROLES,
    requirePlatformRole,
    requireSchoolRole,
    requireOwner,
    requirePlatformAdmin,
    requireSchoolAdmin,
    requireTeacherOrAdmin,
    hasPermission,
};
