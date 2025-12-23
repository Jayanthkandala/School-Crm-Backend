/**
 * Global Error Handler Middleware
 */

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    if (process.env.NODE_ENV === 'development') {
        console.error('Error:', err);
    }

    // Prisma errors
    if (err.code === 'P2002') {
        error.message = 'Duplicate field value entered';
        error.statusCode = 400;
    }

    if (err.code === 'P2025') {
        error.message = 'Record not found';
        error.statusCode = 404;
    }

    if (err.code === 'P2003') {
        error.message = 'Foreign key constraint failed';
        error.statusCode = 400;
    }

    // Validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors).map(val => val.message);
        error.message = messages.join(', ');
        error.statusCode = 400;
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        error.statusCode = 401;
    }

    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        error.statusCode = 401;
    }

    // Multer errors (file upload)
    if (err.name === 'MulterError') {
        if (err.code === 'LIMIT_FILE_SIZE') {
            error.message = 'File size too large';
        } else if (err.code === 'LIMIT_FILE_COUNT') {
            error.message = 'Too many files';
        } else {
            error.message = 'File upload error';
        }
        error.statusCode = 400;
    }

    res.status(error.statusCode || 500).json({
        success: false,
        message: error.message || 'Server Error',
        ...(process.env.NODE_ENV === 'development' && {
            error: err,
            stack: err.stack,
        }),
    });
};

module.exports = errorHandler;
