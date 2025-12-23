// Standardized API Response Helpers
// Use these functions for consistent API responses

/**
 * Success response with data
 * @param {Object} res - Express response object
 * @param {Object} data - Response data
 * @param {String} message - Success message
 * @param {Number} statusCode - HTTP status code (default: 200)
 */
const successResponse = (res, data, message = 'Operation successful', statusCode = 200) => {
    return res.status(statusCode).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

/**
 * Success response with pagination
 * @param {Object} res - Express response object
 * @param {Array} items - Array of items
 * @param {Object} pagination - Pagination info {total, limit, offset}
 * @param {String} message - Success message
 */
const paginatedResponse = (res, items, pagination, message = 'Data retrieved successfully') => {
    return res.status(200).json({
        success: true,
        message,
        data: {
            items,
            pagination: {
                total: pagination.total,
                count: items.length,
                limit: pagination.limit,
                offset: pagination.offset,
                hasMore: (pagination.offset + pagination.limit) < pagination.total,
                pages: Math.ceil(pagination.total / pagination.limit),
                currentPage: Math.floor(pagination.offset / pagination.limit) + 1
            }
        },
        timestamp: new Date().toISOString()
    });
};

/**
 * Error response
 * @param {Object} res - Express response object
 * @param {String} message - Error message
 * @param {Number} statusCode - HTTP status code (default: 400)
 * @param {Object} errors - Validation errors (optional)
 */
const errorResponse = (res, message = 'Operation failed', statusCode = 400, errors = null) => {
    const response = {
        success: false,
        message,
        timestamp: new Date().toISOString()
    };

    if (errors) {
        response.errors = errors;
    }

    return res.status(statusCode).json(response);
};

/**
 * Validation error response
 * @param {Object} res - Express response object
 * @param {Object} errors - Validation errors object
 */
const validationErrorResponse = (res, errors) => {
    return res.status(422).json({
        success: false,
        message: 'Validation failed',
        errors,
        timestamp: new Date().toISOString()
    });
};

/**
 * Not found response
 * @param {Object} res - Express response object
 * @param {String} entity - Entity name (e.g., 'User', 'Student')
 */
const notFoundResponse = (res, entity = 'Resource') => {
    return res.status(404).json({
        success: false,
        message: `${entity} not found`,
        timestamp: new Date().toISOString()
    });
};

/**
 * Unauthorized response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message
 */
const unauthorizedResponse = (res, message = 'Unauthorized access') => {
    return res.status(401).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

/**
 * Forbidden response
 * @param {Object} res - Express response object
 * @param {String} message - Custom message
 */
const forbiddenResponse = (res, message = 'Access forbidden') => {
    return res.status(403).json({
        success: false,
        message,
        timestamp: new Date().toISOString()
    });
};

/**
 * Server error response
 * @param {Object} res - Express response object
 * @param {Error} error - Error object
 */
const serverErrorResponse = (res, error) => {
    console.error('Server Error:', error);

    return res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? error.message : undefined,
        timestamp: new Date().toISOString()
    });
};

/**
 * Created response (201)
 * @param {Object} res - Express response object
 * @param {Object} data - Created resource data
 * @param {String} message - Success message
 */
const createdResponse = (res, data, message = 'Resource created successfully') => {
    return res.status(201).json({
        success: true,
        message,
        data,
        timestamp: new Date().toISOString()
    });
};

/**
 * No content response (204)
 * @param {Object} res - Express response object
 */
const noContentResponse = (res) => {
    return res.status(204).send();
};

module.exports = {
    successResponse,
    paginatedResponse,
    errorResponse,
    validationErrorResponse,
    notFoundResponse,
    unauthorizedResponse,
    forbiddenResponse,
    serverErrorResponse,
    createdResponse,
    noContentResponse
};
