require('dotenv').config();
const app = require('./app');
const { PrismaClient } = require('@prisma/client');
const { startSLACron } = require('./cron/sla-checker');

const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// Test database connection (optional for Swagger viewing)
async function connectDatabase() {
    try {
        await prisma.$connect();
        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.warn('⚠️  Database connection failed:', error.message);
        console.warn('⚠️  Server will start but database operations will fail');
        console.warn('⚠️  You can still view Swagger documentation at /api-docs');
        return false;
    }
}

// Start server
async function startServer() {
    try {
        await connectDatabase();

        const server = app.listen(PORT, () => {
            console.log(' ');
            console.log('🚀 ============================================');
            console.log(`🚀 School CRM Backend Server Started`);
            console.log(`🚀 Environment: ${process.env.NODE_ENV}`);
            console.log(`🚀 Port: ${PORT}`);
            console.log(`🚀 API: http://localhost:${PORT}/api/${process.env.API_VERSION || 'v1'}`);
            console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
            console.log(`💚 Health Check: http://localhost:${PORT}/health`);
            console.log('🚀 ============================================');
            console.log('');
        });

        // Start Background Jobs
        startSLACron();

        // Graceful shutdown
        process.on('SIGTERM', async () => {
            console.log('SIGTERM received, shutting down gracefully...');
            await prisma.$disconnect();
            server.close(() => {
                console.log('Server closed');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}

startServer();

// Export prisma for use in other modules
module.exports = { prisma };
