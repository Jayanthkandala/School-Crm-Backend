require('dotenv').config();

console.log('Testing module loading...\n');

try {
    console.log('1. Loading express...');
    const express = require('express');
    console.log('✅ Express loaded\n');

    console.log('2. Loading swagger...');
    const swaggerUi = require('swagger-ui-express');
    const swaggerSpec = require('./src/config/swagger');
    console.log('✅ Swagger loaded\n');

    console.log('3. Loading app...');
    const app = require('./src/app');
    console.log('✅ App loaded\n');

    console.log('4. Starting server...');
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log('\n🚀 ============================================');
        console.log('🚀 School CRM Backend Server Started');
        console.log('🚀 ============================================');
        console.log(`🚀 Port: ${PORT}`);
        console.log(`📚 Swagger Docs: http://localhost:${PORT}/api-docs`);
        console.log(`💚 Health Check: http://localhost:${PORT}/health`);
        console.log('🚀 ============================================\n');
    });

} catch (error) {
    console.error('\n❌ Error loading modules:');
    console.error(error.message);
    console.error('\nStack trace:');
    console.error(error.stack);
    process.exit(1);
}
