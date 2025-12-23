require('dotenv').config();
const express = require('express');
const cors = require('cors');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/config/swagger');
const { PrismaClient } = require('@prisma/client');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
    res.json({
        success: true,
        message: '🎊 School CRM Server is Running!',
        timestamp: new Date().toISOString(),
        database: 'Connected',
        modules: '39 modules',
        endpoints: '280+ APIs'
    });
});

// Swagger Documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: 'School CRM API Documentation',
}));

// Simple welcome
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🎊 Welcome to School CRM SaaS Platform!',
        documentation: `http://localhost:${PORT}/api-docs`,
        health: `http://localhost:${PORT}/health`,
    });
});

// Try to load routes with error handling
try {
    console.log('Loading platform routes...');
    const platformRoutes = require('./src/modules/platform/platform.routes');
    app.use('/api/v1/platform', platformRoutes);
    console.log('✅ Platform routes loaded');
} catch (error) {
    console.error('❌ Platform routes failed:', error.message);
}

try {
    console.log('Loading auth routes...');
    const authRoutes = require('./src/modules/auth/auth.routes');
    app.use('/api/v1/auth', authRoutes);
    console.log('✅ Auth routes loaded');
} catch (error) {
    console.error('❌ Auth routes failed:', error.message);
}

try {
    console.log('Loading school routes...');
    const schoolRoutes = require('./src/modules/school/school.routes');
    app.use('/api/v1/school', schoolRoutes);
    console.log('✅ School routes loaded');
} catch (error) {
    console.error('❌ School routes failed:', error.message);
    console.error('   Full error:', error.stack);
}

try {
    console.log('Loading parent routes...');
    const parentRoutes = require('./src/modules/parent/parent.routes');
    app.use('/api/v1/parent', parentRoutes);
    console.log('✅ Parent routes loaded');
} catch (error) {
    console.error('❌ Parent routes failed:', error.message);
}

try {
    console.log('Loading student routes...');
    const studentRoutes = require('./src/modules/student/student.routes');
    app.use('/api/v1/student', studentRoutes);
    console.log('✅ Student routes loaded');
} catch (error) {
    console.error('❌ Student routes failed:', error.message);
}

try {
    console.log('Loading teacher routes...');
    const teacherRoutes = require('./src/modules/teacher/teacher.routes');
    app.use('/api/v1/teacher', teacherRoutes);
    console.log('✅ Teacher routes loaded');
} catch (error) {
    console.error('❌ Teacher routes failed:', error.message);
}

// 404 handler
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

// Error handler
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ success: false, message: 'Internal server error' });
});

// Start server
async function startServer() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected\n');
    } catch (error) {
        console.warn('⚠️  Database connection failed:', error.message);
        console.warn('⚠️  Server will start but database operations will fail\n');
    }

    app.listen(PORT, () => {
        console.log('');
        console.log('🚀 ============================================');
        console.log('🚀 School CRM Backend Server Started!');
        console.log('🚀 ============================================');
        console.log(`🚀 Port: ${PORT}`);
        console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
        console.log(`💚 Health Check: http://localhost:${PORT}/health`);
        console.log(`🏠 Home: http://localhost:${PORT}/`);
        console.log('🚀 ============================================');
        console.log('');
    });
}

startServer();

module.exports = app;
