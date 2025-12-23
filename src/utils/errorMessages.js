// Standard Error Messages for School Management System
// Use these constants across all controllers for consistency

module.exports = {
    // Authentication & Authorization
    AUTH: {
        INVALID_CREDENTIALS: 'Invalid email or password',
        ACCOUNT_INACTIVE: 'Your account has been deactivated. Please contact support.',
        ACCOUNT_LOCKED: 'Account is locked due to multiple failed login attempts',
        UNAUTHORIZED: 'You are not authorized to perform this action',
        TOKEN_EXPIRED: 'Your session has expired. Please login again',
        TOKEN_INVALID: 'Invalid authentication token',
    },

    // Validation
    VALIDATION: {
        REQUIRED_FIELDS: 'Missing required fields',
        INVALID_EMAIL: 'Invalid email format',
        INVALID_PHONE: 'Invalid phone number format',
        INVALID_DATE: 'Invalid date format',
        INVALID_AGE: 'Invalid age. Must be between {min} and {max} years',
        WEAK_PASSWORD: 'Password must be at least 8 characters with uppercase, lowercase, number and special character',
    },

    // Duplicate/Uniqueness
    DUPLICATE: {
        EMAIL: 'Email already exists',
        EMPLOYEE_ID: 'Employee ID already exists',
        ADMISSION_NUMBER: 'Admission number already exists',
        ROLL_NUMBER: 'Roll number already exists in this class',
        PHONE: 'Phone number already exists',
        AADHAR: 'Aadhar number already exists',
        PAN: 'PAN number already exists',
    },

    // Not Found
    NOT_FOUND: {
        USER: 'User not found',
        TEACHER: 'Teacher not found',
        STUDENT: 'Student not found',
        CLASS: 'Class not found',
        SUBJECT: 'Subject not found',
        ATTENDANCE: 'Attendance record not found',
        EXAM: 'Exam not found',
        ASSIGNMENT: 'Assignment not found',
        SCHOOL: 'School not found',
    },

    // Business Logic
    BUSINESS: {
        CLASS_FULL: 'Class is full. Maximum capacity: {max}',
        CLASS_HAS_STUDENTS: 'Cannot delete class with {count} students. Please transfer students first.',
        SUBJECT_ASSIGNED: 'Cannot delete subject assigned to {count} classes. Please remove assignments first.',
        FUTURE_DATE: 'Cannot mark attendance for future dates',
        OLD_DATE: 'Cannot mark attendance for dates older than {days} days. Please contact admin.',
        NEGATIVE_VALUE: '{field} cannot be negative',
        INVALID_RANGE: '{field} must be between {min} and {max}',
    },

    // Success Messages
    SUCCESS: {
        CREATED: '{entity} created successfully',
        UPDATED: '{entity} updated successfully',
        DELETED: '{entity} deleted successfully',
        IMPORTED: 'Imported {count} {entity} successfully',
        MARKED: '{entity} marked successfully',
        SENT: '{entity} sent successfully',
    },

    // Generic
    GENERIC: {
        OPERATION_FAILED: 'Operation failed. Please try again.',
        SERVER_ERROR: 'Internal server error. Please contact support.',
        MAINTENANCE: 'System is under maintenance. Please try again later.',
        RATE_LIMIT: 'Too many requests. Please try again later.',
    }
};
