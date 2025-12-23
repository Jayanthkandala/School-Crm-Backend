/**
 * Validate email address
 * @param {string} email 
 * @returns {boolean}
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate Indian phone number
 * @param {string} phone 
 * @returns {boolean}
 */
function validatePhone(phone) {
    // Indian phone: +91 followed by 10 digits or just 10 digits
    const phoneRegex = /^(\+91)?[6-9]\d{9}$/;
    return phoneRegex.test(phone.replace(/[\s-]/g, ''));
}

/**
 * Validate Aadhaar number (India)
 * @param {string} aadhaar 
 * @returns {boolean}
 */
function validateAadhaar(aadhaar) {
    // Aadhaar is 12 digits
    const aadhaarRegex = /^\d{12}$/;
    return aadhaarRegex.test(aadhaar.replace(/[\s-]/g, ''));
}

/**
 * Validate PAN number (India)
 * @param {string} pan 
 * @returns {boolean}
 */
function validatePAN(pan) {
    // PAN format: ABCDE1234F
    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    return panRegex.test(pan);
}

/**
 * Validate Indian PIN code
 * @param {string} pinCode 
 * @returns {boolean}
 */
function validatePinCode(pinCode) {
    const pinRegex = /^\d{6}$/;
    return pinRegex.test(pinCode);
}

/**
 * Validate date is not in future
 * @param {Date|string} date 
 * @returns {boolean}
 */
function validatePastDate(date) {
    const inputDate = new Date(date);
    const today = new Date();
    return inputDate <= today;
}

/**
 * Validate date is in future
 * @param {Date|string} date 
 * @returns {boolean}
 */
function validateFutureDate(date) {
    const inputDate = new Date(date);
    const today = new Date();
    return inputDate > today;
}

/**
 * Validate age range
 * @param {Date|string} dateOfBirth 
 * @param {number} minAge 
 * @param {number} maxAge 
 * @returns {boolean}
 */
function validateAge(dateOfBirth, minAge = 3, maxAge = 25) {
    const dob = new Date(dateOfBirth);
    const today = new Date();
    const age = Math.floor((today - dob) / (365.25 * 24 * 60 * 60 * 1000));
    return age >= minAge && age <= maxAge;
}

/**
 * Sanitize string input
 * @param {string} input 
 * @returns {string}
 */
function sanitizeString(input) {
    if (typeof input !== 'string') return '';
    return input.trim().replace(/[<>]/g, '');
}

/**
 * Validate required fields
 * @param {object} data 
 * @param {string[]} requiredFields 
 * @returns {{valid: boolean, missing: string[]}}
 */
function validateRequiredFields(data, requiredFields) {
    const missing = [];

    for (const field of requiredFields) {
        if (!data[field] || (typeof data[field] === 'string' && data[field].trim() === '')) {
            missing.push(field);
        }
    }

    return {
        valid: missing.length === 0,
        missing,
    };
}

module.exports = {
    validateEmail,
    validatePhone,
    validateAadhaar,
    validatePAN,
    validatePinCode,
    validatePastDate,
    validateFutureDate,
    validateAge,
    sanitizeString,
    validateRequiredFields,
};
