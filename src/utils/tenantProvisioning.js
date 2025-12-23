const { PrismaClient } = require('@prisma/client');
const { execSync } = require('child_process');
const path = require('path');

/**
 * Creates a new tenant database and sets up the schema
 * @param {string} tenantId - Unique identifier for the tenant
 * @param {string} schoolName - Name of the school
 * @returns {Promise<{success: boolean, message: string, databaseName: string}>}
 */
async function createTenantDatabase(tenantId, schoolName) {
    const databaseName = `school_${tenantId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    console.log(`\n🏗️  Creating tenant database: ${databaseName}`);

    try {
        // 1. Create the database using the main Prisma client
        const mainPrisma = new PrismaClient();

        try {
            // PostgreSQL: Create database
            await mainPrisma.$executeRawUnsafe(`CREATE DATABASE "${databaseName}"`);
            console.log(`✅ Database "${databaseName}" created successfully`);
        } catch (error) {
            if (error.code === '42P04') {
                console.log(`ℹ️  Database "${databaseName}" already exists`);
            } else {
                throw error;
            }
        } finally {
            await mainPrisma.$disconnect();
        }

        // 2. Run migrations on the new tenant database
        console.log(`\n📦 Running migrations on ${databaseName}...`);

        const tenantDatabaseUrl = process.env.DATABASE_URL.replace(
            /\/[^\/]+$/,
            `/${databaseName}`
        );

        // Run Prisma migrate deploy for tenant schema
        execSync(
            `npx prisma migrate deploy --schema=${path.join(__dirname, '../../prisma/tenant-schema.prisma')}`,
            {
                env: {
                    ...process.env,
                    DATABASE_URL: tenantDatabaseUrl
                },
                stdio: 'inherit'
            }
        );

        console.log(`✅ Migrations completed for ${databaseName}`);

        // 3. Seed initial data
        console.log(`\n🌱 Seeding initial data for ${schoolName}...`);
        await seedInitialData(databaseName, schoolName);

        console.log(`\n🎉 Tenant database setup complete!`);

        return {
            success: true,
            message: 'Tenant database created and configured successfully',
            databaseName
        };

    } catch (error) {
        console.error(`\n❌ Error creating tenant database:`, error);
        return {
            success: false,
            message: error.message,
            databaseName
        };
    }
}

/**
 * Seeds initial data for a new tenant
 */
async function seedInitialData(databaseName, schoolName) {
    const { getTenantPrismaClient } = require('./tenantDb');
    const tenantDb = getTenantPrismaClient(databaseName);

    try {
        // Create default classes
        const classes = await Promise.all([
            tenantDb.class.create({
                data: {
                    className: 'Class 10',
                    section: 'A',
                    academicYear: new Date().getFullYear().toString(),
                    capacity: 40
                }
            }),
            tenantDb.class.create({
                data: {
                    className: 'Class 10',
                    section: 'B',
                    academicYear: new Date().getFullYear().toString(),
                    capacity: 40
                }
            }),
            tenantDb.class.create({
                data: {
                    className: 'Class 9',
                    section: 'A',
                    academicYear: new Date().getFullYear().toString(),
                    capacity: 40
                }
            })
        ]);

        console.log(`✅ Created ${classes.length} default classes`);

        // Create default subjects
        const subjectData = [
            { subjectName: 'Mathematics', subjectCode: 'MATH', description: 'Mathematics' },
            { subjectName: 'Science', subjectCode: 'SCI', description: 'Science' },
            { subjectName: 'English', subjectCode: 'ENG', description: 'English Language' },
            { subjectName: 'History', subjectCode: 'HIST', description: 'History' },
            { subjectName: 'Geography', subjectCode: 'GEO', description: 'Geography' }
        ];

        const subjects = await Promise.all(
            subjectData.map(subject =>
                tenantDb.subject.create({ data: subject })
            )
        );

        console.log(`✅ Created ${subjects.length} default subjects`);

        // Assign subjects to classes
        const assignments = [];
        for (const cls of classes) {
            for (const subject of subjects) {
                assignments.push(
                    tenantDb.classSubject.create({
                        data: {
                            classId: cls.id,
                            subjectId: subject.id
                        }
                    })
                );
            }
        }

        await Promise.all(assignments);
        console.log(`✅ Assigned subjects to classes`);

    } catch (error) {
        console.error('Error seeding data:', error);
        throw error;
    }
}

/**
 * Deletes a tenant database (use with caution!)
 */
async function deleteTenantDatabase(tenantId) {
    const databaseName = `school_${tenantId.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;

    console.log(`\n🗑️  Deleting tenant database: ${databaseName}`);

    try {
        const mainPrisma = new PrismaClient();

        try {
            // Terminate all connections to the database first
            await mainPrisma.$executeRawUnsafe(`
                SELECT pg_terminate_backend(pg_stat_activity.pid)
                FROM pg_stat_activity
                WHERE pg_stat_activity.datname = '${databaseName}'
                AND pid <> pg_backend_pid();
            `);

            // Drop the database
            await mainPrisma.$executeRawUnsafe(`DROP DATABASE IF EXISTS "${databaseName}"`);
            console.log(`✅ Database "${databaseName}" deleted successfully`);

            return { success: true, message: 'Tenant database deleted successfully' };
        } finally {
            await mainPrisma.$disconnect();
        }
    } catch (error) {
        console.error(`\n❌ Error deleting tenant database:`, error);
        return { success: false, message: error.message };
    }
}

module.exports = {
    createTenantDatabase,
    deleteTenantDatabase,
    seedInitialData
};
