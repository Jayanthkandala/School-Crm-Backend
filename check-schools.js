const { PrismaClient } = require('.prisma/client-platform');

const prisma = new PrismaClient();

async function checkSchools() {
    try {
        console.log('🔍 Checking schools in database...\n');

        const schools = await prisma.school.findMany({
            select: {
                id: true,
                schoolName: true,
                subdomain: true,
                status: true,
                adminEmail: true,
            }
        });

        console.log(`📊 Total schools found: ${schools.length}\n`);

        if (schools.length === 0) {
            console.log('❌ No schools found in database!');
            console.log('\n💡 You need to create a school first.');
            console.log('   Login as owner@schoolcrm.com and create a school from the dashboard.');
        } else {
            console.log('✅ Schools in database:\n');
            schools.forEach((school, index) => {
                console.log(`${index + 1}. ${school.schoolName}`);
                console.log(`   ID: ${school.id}`);
                console.log(`   Subdomain: ${school.subdomain}`);
                console.log(`   Status: ${school.status}`);
                console.log(`   Admin: ${school.adminEmail}`);
                console.log('');
            });
        }

        await prisma.$disconnect();
    } catch (error) {
        console.error('❌ Error:', error.message);
        await prisma.$disconnect();
        process.exit(1);
    }
}

checkSchools();
