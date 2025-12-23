require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const hpp = require('hpp');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

console.log('RESTARTING: Swagger Spec regeneration...');
// Import routes

const platformRoutes = require('./modules/platform/platform.routes');
const authRoutes = require('./modules/auth/auth.routes');
const schoolRoutes = require('./modules/school/school.routes');
const parentRoutes = require('./modules/parent/parent.routes');
const studentRoutes = require('./modules/student/student.routes');
const teacherRoutes = require('./modules/teacher/teacher.routes');
const uploadRoutes = require('./modules/common/upload.routes');
const webhookRoutes = require('./modules/webhooks/webhooks.routes');

// Import middleware
const errorHandler = require('./middleware/error.middleware');
const { notFound } = require('./middleware/notFound.middleware');

const app = express();

// ============================================
// SECURITY MIDDLEWARE
// ============================================

// Set security HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// Enable CORS
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || '*',
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api', limiter);

// Stricter rate limit for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 requests per window (increased for development)
  message: 'Too many login attempts, please try again later.',
  skipSuccessfulRequests: true,
});

// Data sanitization against NoSQL injection
app.use(mongoSanitize());

// Data sanitization against XSS
app.use(xss());

// Prevent parameter pollution
app.use(hpp());

// Compress responses
app.use(compression());

// ============================================
// BODY PARSERS
// ============================================

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ============================================
// LOGGING
// ============================================

if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// ============================================
// API DOCUMENTATION (SWAGGER)
// ============================================

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'School CRM API Documentation',
}));

// ============================================
// HEALTH CHECK
// ============================================

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ============================================
// API ROUTES
// ============================================

const API_VERSION = process.env.API_VERSION || 'v1';

// Authentication routes (with stricter rate limiting)
app.use(`/api/${API_VERSION}/auth`, authLimiter, authRoutes);

// Platform owner routes
app.use(`/api/${API_VERSION}/platform`, platformRoutes);

// School routes
app.use(`/api/${API_VERSION}/school`, schoolRoutes);

// Parent portal routes
app.use(`/api/${API_VERSION}/parent`, parentRoutes);

// Student portal routes
app.use(`/api/${API_VERSION}/student`, studentRoutes);

// Teacher portal routes
app.use(`/api/${API_VERSION}/teacher`, teacherRoutes);

// Common routes (upload, etc.)
app.use(`/api/${API_VERSION}/common/upload`, uploadRoutes);

// Webhook routes (no auth required - verified by signature)
app.use(`/api/${API_VERSION}/webhooks/payment`, webhookRoutes);

// ============================================
// ERROR HANDLING
// ============================================

// 404 handler
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ============================================
// GRACEFUL SHUTDOWN
// ============================================

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  server.close(() => {
    console.log('HTTP server closed');
    process.exit(0);
  });
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

module.exports = app;
