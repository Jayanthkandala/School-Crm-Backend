/**
 * Audit Logging Utility
 * Tracks sensitive operations for security and compliance
 */

const prisma = require('../config/database');

/**
 * Log an audit event to platform database
 */
async function logAuditEvent({
    userId,
    userEmail,
    action,
    resource,
    resourceId,
    details = {},
    ipAddress,
    userAgent,
    status = 'SUCCESS'
}) {
    try {
        await prisma.platformAuditLog.create({
            data: {
                userId,
                userEmail,
                action,
                resource,
                resourceId,
                details: JSON.stringify(details),
                ipAddress,
                userAgent,
                status,
                timestamp: new Date()
            }
        });
    } catch (error) {
        // Don't fail the operation if audit logging fails
        console.error('Audit logging error:', error);
    }
}

/**
 * Log authentication events
 */
async function logAuthEvent(req, action, userId, userEmail, status, details = {}) {
    await logAuditEvent({
        userId,
        userEmail,
        action,
        resource: 'AUTH',
        resourceId: userId,
        details,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        status
    });
}

/**
 * Log data modification events
 */
async function logDataEvent(req, action, resource, resourceId, details = {}) {
    const user = req.user || {};

    await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action,
        resource,
        resourceId,
        details,
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        status: 'SUCCESS'
    });
}

/**
 * Log security events
 */
async function logSecurityEvent(req, event, severity, details = {}) {
    const user = req.user || {};

    await logAuditEvent({
        userId: user.id,
        userEmail: user.email,
        action: event,
        resource: 'SECURITY',
        resourceId: null,
        details: { severity, ...details },
        ipAddress: req.ip || req.connection.remoteAddress,
        userAgent: req.headers['user-agent'],
        status: severity
    });
}

/**
 * Audit action constants
 */
const AUDIT_ACTIONS = {
    // Authentication
    LOGIN: 'LOGIN',
    LOGOUT: 'LOGOUT',
    LOGIN_FAILED: 'LOGIN_FAILED',
    ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
    PASSWORD_CHANGED: 'PASSWORD_CHANGED',
    PASSWORD_RESET: 'PASSWORD_RESET',

    // User Management
    USER_CREATED: 'USER_CREATED',
    USER_UPDATED: 'USER_UPDATED',
    USER_DELETED: 'USER_DELETED',

    // Student Management
    STUDENT_CREATED: 'STUDENT_CREATED',
    STUDENT_UPDATED: 'STUDENT_UPDATED',
    STUDENT_DELETED: 'STUDENT_DELETED',
    STUDENT_PROMOTED: 'STUDENT_PROMOTED',
    STUDENT_TRANSFERRED: 'STUDENT_TRANSFERRED',
    STUDENTS_BULK_IMPORTED: 'STUDENTS_BULK_IMPORTED',

    // Teacher Management
    TEACHER_CREATED: 'TEACHER_CREATED',
    TEACHER_UPDATED: 'TEACHER_UPDATED',
    TEACHER_DELETED: 'TEACHER_DELETED',
    TEACHER_ASSIGNED: 'TEACHER_ASSIGNED',
    TEACHERS_BULK_IMPORTED: 'TEACHERS_BULK_IMPORTED',

    // School Management
    SCHOOL_CREATED: 'SCHOOL_CREATED',
    SCHOOL_UPDATED: 'SCHOOL_UPDATED',
    SCHOOL_SUSPENDED: 'SCHOOL_SUSPENDED',
    SCHOOL_ACTIVATED: 'SCHOOL_ACTIVATED',

    // Exam Management
    EXAM_CREATED: 'EXAM_CREATED',
    EXAM_UPDATED: 'EXAM_UPDATED',
    EXAM_DELETED: 'EXAM_DELETED',
    GRADES_ENTERED: 'GRADES_ENTERED',
    GRADES_BULK_IMPORTED: 'GRADES_BULK_IMPORTED',

    // Security Events
    UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
    INVALID_TOKEN: 'INVALID_TOKEN',
    SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY'
};

module.exports = {
    logAuditEvent,
    logAuthEvent,
    logDataEvent,
    logSecurityEvent,
    AUDIT_ACTIONS
};
