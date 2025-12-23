const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Creating Platform Admin...\n');

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash('owner123', 10);

        // Create Platform Owner
        const platformOwner = await prisma.platformUser.upsert({
            where: { email: 'owner@schoolcrm.com' },
            update: {
                passwordHash: hashedPassword,
                isActive: true,
            },
            create: {
                fullName: 'Platform Owner',
                email: 'owner@schoolcrm.com',
                passwordHash: hashedPassword,
                role: 'OWNER',
                isActive: true,
            },
        });

        console.log('✅ Platform Admin Created Successfully!\n');
        console.log('📋 Login Credentials:');
        console.log('   URL: http://localhost:5177/login');
        console.log('   Tab: Platform');
        console.log('   Email: owner@schoolcrm.com');
        console.log('   Password: owner123');
        console.log('\n🎉 You can now login and create schools from the platform dashboard!');

    } catch (error) {
        console.error('❌ Error creating platform admin:', error);
        throw error;
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
