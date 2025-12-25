const { PrismaClient } = require('../generated/tenant-client');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);
const path = require('path');

// Cache for tenant Prisma clients
const tenantClients = new Map();
// Cache for initialized schemas to avoid repeated checks/migrations
const initializedTenants = new Set();

/**
 * Generate a safe schema name from tenant ID
 */
function getMainSchemaName(tenantId) {
    // Replace hyphens to make it a valid schema name
    return `school_${tenantId.replace(/-/g, '_')}`;
}

/**
 * Get or create Prisma client for a specific tenant
 * @param {string} tenantId - The tenant/school ID or subdomain
 * @returns {PrismaClient} Prisma client connected to tenant database
 */
function getTenantPrismaClient(tenantId) {
    // Check if client already exists in cache
    if (tenantClients.has(tenantId)) {
        return tenantClients.get(tenantId);
    }

    // Create database name from tenant ID
    const databaseName = `school_${tenantId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    // Get base database URL and replace the database name
    const baseDatabaseUrl = process.env.DATABASE_URL;
    const tenantDatabaseUrl = baseDatabaseUrl.replace(/\/[^\/]+(\?|$)/, `/${databaseName}$1`);

    console.log(`🔌 Creating Prisma client for database: ${databaseName}`);

    const client = new PrismaClient({
        datasources: {
            db: {
                url: tenantDatabaseUrl,
            },
        },
    });

    // Cache the client
    tenantClients.set(tenantId, client);

    return client;
}

/**
 * Ensure the tenant database exists and is up to date
 * This should be called before accessing tenant data
 */
async function ensureTenantSchema(tenantId) {
    // If we've already initialized this tenant in this process, skip
    if (initializedTenants.has(tenantId)) {
        console.log(`⏭️  Tenant ${tenantId} already initialized in this process`);
        return;
    }

    const databaseName = `school_${tenantId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
    console.log(`🛠️ Ensuring database exists for tenant: ${tenantId} (${databaseName})`);

    // Connect to main database to create tenant database
    const mainClient = new PrismaClient({
        datasources: {
            db: {
                url: process.env.DATABASE_URL,
            },
        },
    });

    try {
        // 1. Create database if it doesn't exist
        try {
            await mainClient.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
            console.log(`✅ Database "${databaseName}" created`);
        } catch (error) {
            // PostgreSQL error code 42P04 = database already exists
            // Also check error message for "already exists"
            if (error.code === '42P04' || error.message?.includes('already exists')) {
                console.log(`ℹ️  Database "${databaseName}" already exists`);
            } else {
                console.error(`❌ Error creating database:`, error.code, error.message);
                throw error;
            }
        }

        // 2. Always run migrations to ensure schema is up to date
        // db push is idempotent, so it's safe to run even if schema exists
        const baseDatabaseUrl = process.env.DATABASE_URL;
        const tenantDatabaseUrl = baseDatabaseUrl.replace(/\/[^\/]+(\?|$)/, `/${databaseName}$1`);
        const schemaPath = path.join(__dirname, '../../prisma/tenant-schema.prisma');

        console.log(`📦 Running migrations on ${databaseName}...`);

        const cmd = `npx prisma db push --schema="${schemaPath}" --skip-generate --accept-data-loss`;

        await execPromise(cmd, {
            env: {
                ...process.env,
                TENANT_DATABASE_URL: tenantDatabaseUrl
            }
        });

        console.log(`✅ Migrations completed for ${databaseName}`);
        initializedTenants.add(tenantId);

    } catch (error) {
        console.error(`❌ Failed to ensure tenant database for ${tenantId}:`, error);
        throw error;
    } finally {
        await mainClient.$disconnect();
    }
}

/**
 * Close all tenant database connections
 */
async function closeAllTenantConnections() {
    const promises = [];

    for (const [tenantId, client] of tenantClients.entries()) {
        promises.push(client.$disconnect());
    }

    await Promise.all(promises);
    tenantClients.clear();
    initializedTenants.clear();
}

/**
 * Remove a specific tenant client from cache
 * @param {string} tenantId 
 */
async function closeTenantConnection(tenantId) {
    const client = tenantClients.get(tenantId);

    if (client) {
        await client.$disconnect();
        tenantClients.delete(tenantId);
        initializedTenants.delete(tenantId);
    }
}

module.exports = {
    getTenantPrismaClient,
    ensureTenantSchema,
    closeAllTenantConnections,
    closeTenantConnection,
};
