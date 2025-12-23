const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkSystem() {
    console.log('🔍 SYSTEM DIAGNOSTIC\n');

    try {
        // Check platform database
        console.log('📊 Platform Database:');
        const schools = await prisma.school.findMany({
            select: {
                id: true,
                schoolName: true,
                subdomain: true,
                status: true,
                dbName: true,
            }
        });

        console.log(`Found ${schools.length} schools:`);
        schools.forEach(school => {
            console.log(`  - ${school.schoolName} (${school.subdomain})`);
            console.log(`    ID: ${school.id}`);
            console.log(`    Status: ${school.status}`);
            console.log(`    DB Name: ${school.dbName || 'Not set'}`);
        });

        // Check if tenant databases exist
        console.log('\n🗄️  Checking Tenant Databases:');
        for (const school of schools) {
            const dbName = `school_${school.subdomain.toLowerCase().replace(/[^a-z0-9]/g, '_')}`;
            try {
                const result = await prisma.$queryRawUnsafe(`
                    SELECT datname FROM pg_database WHERE datname = '${dbName}'
                `);
                if (result.length > 0) {
                    console.log(`  ✅ ${dbName} - EXISTS`);
                } else {
                    console.log(`  ❌ ${dbName} - MISSING`);
                }
            } catch (error) {
                console.log(`  ❌ ${dbName} - ERROR: ${error.message}`);
            }
        }

    } catch (error) {
        console.error('❌ Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSystem();
