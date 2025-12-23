const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

/**
 * Request logging middleware
 */
const requestLogger = morgan('combined', {
    stream: fs.createWriteStream(path.join(__dirname, '../../logs/access.log'), { flags: 'a' }),
});

/**
 * Performance monitoring middleware
 */
const performanceMonitor = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;

        // Log slow requests (>1000ms)
        if (duration > 1000) {
            console.warn(`Slow request: ${req.method} ${req.url} - ${duration}ms`);

            // Log to file
            const logEntry = {
                timestamp: new Date().toISOString(),
                method: req.method,
                url: req.url,
                duration: `${duration}ms`,
                statusCode: res.statusCode,
                userAgent: req.headers['user-agent'],
            };

            fs.appendFileSync(
                path.join(__dirname, '../../logs/slow-requests.log'),
                JSON.stringify(logEntry) + '\n'
            );
        }
    });

    next();
};

/**
 * Error tracking middleware
 */
const errorTracker = (err, req, res, next) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        error: {
            message: err.message,
            stack: err.stack,
        },
        request: {
            method: req.method,
            url: req.url,
            headers: req.headers,
            body: req.body,
        },
        user: req.user ? { id: req.user.id, email: req.user.email } : null,
    };

    // Log to file
    fs.appendFileSync(
        path.join(__dirname, '../../logs/errors.log'),
        JSON.stringify(errorLog) + '\n'
    );

    // TODO: Send to Sentry or error tracking service
    // Sentry.captureException(err);

    res.status(500).json({
        success: false,
        message: process.env.NODE_ENV === 'production'
            ? 'Internal server error'
            : err.message,
    });
};

/**
 * API metrics collector
 */
const metricsCollector = {
    requests: {},

    record(endpoint, duration, statusCode) {
        if (!this.requests[endpoint]) {
            this.requests[endpoint] = {
                count: 0,
                totalDuration: 0,
                errors: 0,
                avgDuration: 0,
            };
        }

        this.requests[endpoint].count++;
        this.requests[endpoint].totalDuration += duration;
        this.requests[endpoint].avgDuration =
            this.requests[endpoint].totalDuration / this.requests[endpoint].count;

        if (statusCode >= 400) {
            this.requests[endpoint].errors++;
        }
    },

    getMetrics() {
        return this.requests;
    },

    reset() {
        this.requests = {};
    },
};

/**
 * Metrics middleware
 */
const metricsMiddleware = (req, res, next) => {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const endpoint = `${req.method} ${req.route?.path || req.url}`;
        metricsCollector.record(endpoint, duration, res.statusCode);
    });

    next();
};

/**
 * Get API metrics
 */
const getMetrics = (req, res) => {
    const metrics = metricsCollector.getMetrics();

    // Calculate overall stats
    const totalRequests = Object.values(metrics).reduce((sum, m) => sum + m.count, 0);
    const totalErrors = Object.values(metrics).reduce((sum, m) => sum + m.errors, 0);
    const avgDuration = Object.values(metrics).reduce((sum, m) => sum + m.avgDuration, 0) / Object.keys(metrics).length;

    res.json({
        success: true,
        data: {
            overall: {
                totalRequests,
                totalErrors,
                errorRate: totalRequests > 0 ? (totalErrors / totalRequests * 100).toFixed(2) + '%' : '0%',
                avgDuration: Math.round(avgDuration) + 'ms',
            },
            endpoints: metrics,
        },
    });
};

/**
 * Health check endpoint
 */
const healthCheck = async (req, res) => {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    try {
        // Check database connection
        await prisma.$queryRaw`SELECT 1`;

        const uptime = process.uptime();
        const memoryUsage = process.memoryUsage();

        res.json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                uptime: `${Math.floor(uptime / 60)} minutes`,
                memory: {
                    used: `${Math.round(memoryUsage.heapUsed / 1024 / 1024)}MB`,
                    total: `${Math.round(memoryUsage.heapTotal / 1024 / 1024)}MB`,
                },
                database: 'connected',
            },
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            data: {
                status: 'unhealthy',
                error: error.message,
            },
        });
    }
};

// Ensure logs directory exists
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
    fs.mkdirSync(logsDir, { recursive: true });
}

module.exports = {
    requestLogger,
    performanceMonitor,
    errorTracker,
    metricsMiddleware,
    getMetrics,
    healthCheck,
};
