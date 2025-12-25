const { PrismaClient } = require('@prisma/client');
const { ensureTenantSchema, getTenantPrismaClient } = require('./src/utils/tenantDb');
const { hashPassword } = require('./src/utils/encryption.util');

const prisma = new PrismaClient();

async function setupAllSchools() {
    try {
        // Get all schools
        const schools = await prisma.school.findMany({
            select: {
                id: true,
                schoolName: true,
                subdomain: true,
                dbName: true,
                tenantId: true,
                adminEmail: true,
                status: true
            }
        });

        console.log(`📋 Found ${schools.length} schools\n`);

        for (const school of schools) {
            console.log(`\n${'='.repeat(60)}`);
            console.log(`🏫 School: ${school.schoolName}`);
            console.log(`   Subdomain: ${school.subdomain}`);
            console.log(`   Tenant ID: ${school.tenantId || school.id}`);
            console.log(`   Admin Email: ${school.adminEmail}`);
            console.log(`   Status: ${school.status}`);

            try {
                // Use the existing ensureTenantSchema function
                const tenantIdentifier = school.id; // Use UUID as per your requirement
                console.log(`   🔧 Setting up tenant database for: ${tenantIdentifier}`);

                await ensureTenantSchema(tenantIdentifier);

                // Get tenant database client
                const tenantDb = getTenantPrismaClient(tenantIdentifier);

                // Check if admin user exists
                const existingAdmin = await tenantDb.user.findUnique({
                    where: { email: school.adminEmail }
                });

                if (!existingAdmin) {
                    // Create admin user
                    const tempPassword = 'Admin@123'; // Default password
                    const passwordHash = await hashPassword(tempPassword);

                    await tenantDb.user.create({
                        data: {
                            email: school.adminEmail,
                            fullName: 'School Admin',
                            passwordHash: passwordHash,
                            role: 'SCHOOL_ADMIN',
                            isActive: true
                        }
                    });

                    console.log(`   ✅ Admin user created`);
                    console.log(`   🔑 Temporary password: ${tempPassword}`);
                } else {
                    console.log(`   ℹ️  Admin user already exists`);
                }

                console.log(`   ✅ Setup complete for ${school.schoolName}`);

            } catch (error) {
                console.log(`   ❌ Error:`, error.message);
            }
        }

        console.log(`\n${'='.repeat(60)}`);
        console.log('\n✅ All schools processed!');
        console.log('\n📝 Login Instructions:');
        schools.forEach(s => {
            console.log(`\n   🏫 ${s.schoolName}`);
            console.log(`      Type: School`);
            console.log(`      Tenant ID: ${s.subdomain}`);
            console.log(`      Email: ${s.adminEmail}`);
            console.log(`      Password: Admin@123 (default)`);
        });

    } catch (error) {
        console.error('❌ Fatal Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

setupAllSchools();
