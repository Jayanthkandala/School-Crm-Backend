const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'School CRM API Documentation',
            version: '1.0.0',
            description: 'Complete API documentation for School CRM SaaS Platform',
            contact: {
                name: 'API Support',
                email: 'support@schoolcrm.com',
            },
        },
        servers: [
            {
                url: 'http://localhost:5000/api/v1',
                description: 'Development server',
            },
            {
                url: 'https://api.schoolcrm.com/api/v1',
                description: 'Production server',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        success: {
                            type: 'boolean',
                            example: false,
                        },
                        message: {
                            type: 'string',
                            example: 'Error message',
                        },
                    },
                },
                Student: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        admissionNumber: { type: 'string' },
                        userId: { type: 'string' },
                        classId: { type: 'string' },
                        dateOfBirth: { type: 'string', format: 'date' },
                        gender: { type: 'string', enum: ['MALE', 'FEMALE', 'OTHER'] },
                        aadhaarNumber: { type: 'string' },
                        category: { type: 'string', enum: ['GENERAL', 'OBC', 'SC', 'ST', 'EWS'] },
                        admissionDate: { type: 'string', format: 'date' },
                        status: { type: 'string', enum: ['ACTIVE', 'INACTIVE', 'ALUMNI'] },
                    },
                },
                Teacher: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        employeeId: { type: 'string' },
                        userId: { type: 'string' },
                        qualification: { type: 'string' },
                        specialization: { type: 'string' },
                        experience: { type: 'number' },
                        joiningDate: { type: 'string', format: 'date' },
                        salary: { type: 'number' },
                        isActive: { type: 'boolean' },
                    },
                },
                FeeInvoice: {
                    type: 'object',
                    properties: {
                        id: { type: 'string' },
                        invoiceNumber: { type: 'string' },
                        studentId: { type: 'string' },
                        amount: { type: 'number' },
                        discount: { type: 'number' },
                        lateFee: { type: 'number' },
                        total: { type: 'number' },
                        status: { type: 'string', enum: ['PENDING', 'PARTIAL', 'PAID', 'OVERDUE'] },
                        dueDate: { type: 'string', format: 'date' },
                    },
                },
            },
        },
        security: [
            {
                bearerAuth: [],
            },
        ],
    },
    apis: ['./src/modules/**/*.routes.js', './src/modules/**/*.controller.js'],
};

const specs = swaggerJsdoc(options);

module.exports = specs;

