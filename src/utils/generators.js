/**
 * Generate admission number
 * Format: ADM/2024-25/001
 * @param {number} sequence - Sequential number
 * @param {string} academicYear - Academic year (e.g., "2024-25")
 * @returns {string}
 */
function generateAdmissionNumber(sequence, academicYear) {
    const year = academicYear || getCurrentAcademicYear();
    const paddedSequence = sequence.toString().padStart(4, '0');
    return `ADM/${year}/${paddedSequence}`;
}

/**
 * Generate invoice number
 * Format: INV/2024-25/001
 * @param {number} sequence 
 * @param {string} academicYear 
 * @returns {string}
 */
function generateInvoiceNumber(sequence, academicYear) {
    const year = academicYear || getCurrentAcademicYear();
    const paddedSequence = sequence.toString().padStart(4, '0');
    return `INV/${year}/${paddedSequence}`;
}

/**
 * Generate receipt number
 * Format: REC/2024-25/001
 * @param {number} sequence 
 * @param {string} academicYear 
 * @returns {string}
 */
function generateReceiptNumber(sequence, academicYear) {
    const year = academicYear || getCurrentAcademicYear();
    const paddedSequence = sequence.toString().padStart(4, '0');
    return `REC/${year}/${paddedSequence}`;
}

/**
 * Generate certificate number
 * Format: CERT/2024-25/001
 * @param {number} sequence 
 * @param {string} academicYear 
 * @returns {string}
 */
function generateCertificateNumber(sequence, academicYear) {
    const year = academicYear || getCurrentAcademicYear();
    const paddedSequence = sequence.toString().padStart(4, '0');
    return `CERT/${year}/${paddedSequence}`;
}

/**
 * Generate employee ID
 * Format: EMP/2024/001
 * @param {number} sequence 
 * @returns {string}
 */
function generateEmployeeId(sequence) {
    const year = new Date().getFullYear();
    const paddedSequence = sequence.toString().padStart(4, '0');
    return `EMP/${year}/${paddedSequence}`;
}

/**
 * Generate roll number
 * Format: Class-Section-Number (e.g., 10-A-01)
 * @param {string} className 
 * @param {string} section 
 * @param {number} number 
 * @returns {string}
 */
function generateRollNumber(className, section, number) {
    const paddedNumber = number.toString().padStart(2, '0');
    return `${className}-${section}-${paddedNumber}`;
}

/**
 * Get current academic year (India: April to March)
 * @returns {string} Format: "2024-25"
 */
function getCurrentAcademicYear() {
    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth() + 1; // 1-12

    // If month is Jan-Mar, academic year is previous year
    // If month is Apr-Dec, academic year is current year
    const startYear = currentMonth >= 4 ? currentYear : currentYear - 1;
    const endYear = startYear + 1;

    return `${startYear}-${endYear.toString().slice(-2)}`;
}

/**
 * Generate random password
 * @param {number} length 
 * @returns {string}
 */
function generateRandomPassword(length = 8) {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';

    for (let i = 0; i < length; i++) {
        password += charset.charAt(Math.floor(Math.random() * charset.length));
    }

    return password;
}

/**
 * Generate OTP
 * @param {number} length 
 * @returns {string}
 */
function generateOTP(length = 6) {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
        otp += digits.charAt(Math.floor(Math.random() * digits.length));
    }

    return otp;
}

module.exports = {
    generateAdmissionNumber,
    generateInvoiceNumber,
    generateReceiptNumber,
    generateCertificateNumber,
    generateEmployeeId,
    generateRollNumber,
    getCurrentAcademicYear,
    generateRandomPassword,
    generateOTP,
};
