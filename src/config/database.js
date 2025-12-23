const { PrismaClient } = require('@prisma/client');

// Platform database Prisma client
const prisma = new PrismaClient();

module.exports = prisma;
