const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createPlatformOwner() {
    try {
        const hash = await bcrypt.hash('Jayanth143@', 10);

        const user = await prisma.platformUser.upsert({
            where: { email: 'kandalajayanth401@gmail.com' },
            update: {
                passwordHash: hash,
                isActive: true
            },
            create: {
                email: 'kandalajayanth401@gmail.com',
                fullName: 'Jayanth Kandala',
                passwordHash: hash,
                role: 'OWNER',
                isActive: true
            }
        });

        console.log('✅ Platform Owner created/updated:');
        console.log('   Email:', user.email);
        console.log('   Name:', user.fullName);
        console.log('   Role:', user.role);
        console.log('   Active:', user.isActive);
        console.log('\n🔑 Login credentials:');
        console.log('   Email: kandalajayanth401@gmail.com');
        console.log('   Password: Jayanth143@');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

createPlatformOwner();
