/**
 * Validation Utilities
 * Centralized validation functions for input sanitization and security
 */

/**
 * Validate email format
 */
function isValidEmail(email) {
    if (!email || typeof email !== 'string') {
        return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email.trim());
}

/**
 * Validate password complexity
 */
function validatePassword(password) {
    const minLength = 8;
    const maxLength = 128;

    if (!password || typeof password !== 'string') {
        return { valid: false, message: 'Password is required' };
    }

    if (password.length < minLength) {
        return { valid: false, message: `Password must be at least ${minLength} characters` };
    }

    if (password.length > maxLength) {
        return { valid: false, message: `Password must not exceed ${maxLength} characters` };
    }

    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUpperCase || !hasLowerCase || !hasNumbers) {
        return {
            valid: false,
            message: 'Password must contain at least one uppercase letter, one lowercase letter, and one number'
        };
    }

    return { valid: true };
}

/**
 * Validate UUID format
 */
function isValidUUID(id) {
    if (!id || typeof id !== 'string') {
        return false;
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(id);
}

/**
 * Validate and parse date
 */
function parseDate(dateString, fieldName = 'Date') {
    if (!dateString) {
        return null;
    }

    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
        throw new Error(`Invalid ${fieldName} format`);
    }

    return date;
}

/**
 * Validate numeric value within range
 */
function validateNumeric(value, min, max, fieldName = 'Value') {
    const num = parseFloat(value);

    if (isNaN(num)) {
        throw new Error(`${fieldName} must be a number`);
    }

    if (num < min || num > max) {
        throw new Error(`${fieldName} must be between ${min} and ${max}`);
    }

    return num;
}

/**
 * Validate pagination parameters
 */
function validatePagination(page, limit) {
    const MAX_PAGE_SIZE = 100;
    const DEFAULT_PAGE = 1;
    const DEFAULT_LIMIT = 10;

    const safePage = Math.max(parseInt(page) || DEFAULT_PAGE, 1);
    const safeLimit = Math.min(Math.max(parseInt(limit) || DEFAULT_LIMIT, 1), MAX_PAGE_SIZE);

    return { page: safePage, limit: safeLimit };
}

/**
 * Validate bulk operation size
 */
function validateBulkSize(array, maxSize = 1000, itemName = 'items') {
    if (!Array.isArray(array)) {
        throw new Error(`${itemName} must be an array`);
    }

    if (array.length === 0) {
        throw new Error(`${itemName} array cannot be empty`);
    }

    if (array.length > maxSize) {
        throw new Error(`Maximum ${maxSize} ${itemName} allowed per operation`);
    }

    return true;
}

/**
 * Sanitize string input
 */
function sanitizeString(str, maxLength = 255) {
    if (!str) return '';

    // Remove null bytes and trim
    let sanitized = String(str).replace(/\0/g, '').trim();

    // Limit length
    if (sanitized.length > maxLength) {
        sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
}

/**
 * Validate phone number (basic)
 */
function isValidPhone(phone) {
    if (!phone) return true; // Optional field

    // Remove spaces, dashes, parentheses
    const cleaned = phone.replace(/[\s\-\(\)]/g, '');

    // Check if it's 10-15 digits (international format)
    const phoneRegex = /^[\+]?[0-9]{10,15}$/;
    return phoneRegex.test(cleaned);
}

/**
 * Validate admission/employee number format
 */
function isValidIdentifier(identifier, prefix = '') {
    if (!identifier || typeof identifier !== 'string') {
        return false;
    }

    // Alphanumeric with optional prefix
    const regex = new RegExp(`^${prefix}[A-Z0-9]{4,20}$`, 'i');
    return regex.test(identifier);
}

module.exports = {
    isValidEmail,
    validatePassword,
    isValidUUID,
    parseDate,
    validateNumeric,
    validatePagination,
    validateBulkSize,
    sanitizeString,
    isValidPhone,
    isValidIdentifier
};
