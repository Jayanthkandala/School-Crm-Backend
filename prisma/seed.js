const { PrismaClient: PlatformPrismaClient } = require('.prisma/client-platform');
const { hashPassword } = require('../src/utils/encryption.util');

const prisma = new PlatformPrismaClient();

async function main() {
    console.log('🌱 Starting database seeding...\\n');

    // ============================================
    // 1. PLATFORM USERS (CRM Owner & Staff)
    // ============================================
    console.log('📊 Seeding Platform Users...');

    const platformUsers = [
        {
            fullName: 'Platform Owner',
            email: 'owner@schoolcrm.com',
            password: 'owner123',
            role: 'OWNER'
        },
        {
            fullName: 'Platform Admin',
            email: 'admin@schoolcrm.com',
            password: 'admin123',
            role: 'ADMIN'
        },
        {
            fullName: 'Support Staff',
            email: 'support@schoolcrm.com',
            password: 'support123',
            role: 'SUPPORT'
        },
        {
            fullName: 'Sales Manager',
            email: 'sales@schoolcrm.com',
            password: 'sales123',
            role: 'SALES'
        },
        {
            fullName: 'Finance Manager',
            email: 'finance@schoolcrm.com',
            password: 'finance123',
            role: 'FINANCE'
        }
    ];

    for (const userData of platformUsers) {
        const existingUser = await prisma.platformUser.findUnique({
            where: { email: userData.email }
        });

        if (!existingUser) {
            const hashedPassword = await hashPassword(userData.password);
            await prisma.platformUser.create({
                data: {
                    fullName: userData.fullName,
                    email: userData.email,
                    passwordHash: hashedPassword,
                    role: userData.role,
                    isActive: true
                }
            });
            console.log(`✅ Created: ${userData.fullName} (${userData.email})`);
        } else {
            console.log(`⏭️  Skipped: ${userData.email} (already exists)`);
        }
    }

    // ============================================
    // 2. SUBSCRIPTION PLANS
    // ============================================
    console.log('\\n💳 Seeding Subscription Plans...');

    const plans = [
        {
            planName: 'Free Trial',
            planCode: 'TRIAL',
            description: '30-day free trial with basic features',
            priceMonthly: 0,
            priceYearly: 0,
            maxStudents: 50,
            maxTeachers: 5,
            maxStorageGb: 1,
            features: {
                students: true,
                teachers: true,
                attendance: true,
                exams: false,
                fees: false,
                library: false,
                transport: false
            }
        },
        {
            planName: 'Basic Plan',
            planCode: 'BASIC',
            description: 'Perfect for small schools',
            priceMonthly: 2999,
            priceYearly: 29990,
            maxStudents: 200,
            maxTeachers: 20,
            maxStorageGb: 5,
            features: {
                students: true,
                teachers: true,
                attendance: true,
                exams: true,
                fees: true,
                library: false,
                transport: false
            }
        },
        {
            planName: 'Professional Plan',
            planCode: 'PRO',
            description: 'For growing schools',
            priceMonthly: 5999,
            priceYearly: 59990,
            maxStudents: 500,
            maxTeachers: 50,
            maxStorageGb: 20,
            features: {
                students: true,
                teachers: true,
                attendance: true,
                exams: true,
                fees: true,
                library: true,
                transport: true,
                assignments: true,
                certificates: true
            }
        },
        {
            planName: 'Enterprise Plan',
            planCode: 'ENTERPRISE',
            description: 'Unlimited everything',
            priceMonthly: 14999,
            priceYearly: 149990,
            maxStudents: 9999,
            maxTeachers: 500,
            maxStorageGb: 100,
            features: {
                students: true,
                teachers: true,
                attendance: true,
                exams: true,
                fees: true,
                library: true,
                transport: true,
                assignments: true,
                certificates: true,
                customReports: true,
                apiAccess: true,
                whiteLabel: true
            }
        }
    ];

    for (const planData of plans) {
        const existingPlan = await prisma.subscriptionPlan.findUnique({
            where: { planCode: planData.planCode }
        });

        if (!existingPlan) {
            await prisma.subscriptionPlan.create({
                data: planData
            });
            console.log(`✅ Created: ${planData.planName}`);
        } else {
            console.log(`⏭️  Skipped: ${planData.planCode} (already exists)`);
        }
    }

    // ============================================
    // 3. DEMO SCHOOL
    // ============================================
    console.log('\\n🏫 Seeding Demo School...');

    const trialPlan = await prisma.subscriptionPlan.findUnique({
        where: { planCode: 'TRIAL' }
    });

    const demoSchool = {
        schoolName: 'Demo High School',
        subdomain: 'demo',
        adminName: 'School Admin',
        adminEmail: 'admin@demo.school',
        adminPhone: '+91 9876543210',
        address: '123 Education Street',
        city: 'Hyderabad',
        state: 'Telangana',
        country: 'India',
        pinCode: '500001',
        status: 'ACTIVE',
        subscriptionPlanId: trialPlan?.id,
        trialEndsAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
        dbName: 'school_demo'
    };

    const existingSchool = await prisma.school.findUnique({
        where: { subdomain: 'demo' }
    });

    let school;
    if (!existingSchool) {
        school = await prisma.school.create({
            data: demoSchool
        });
        console.log(`✅ Created: ${demoSchool.schoolName} (Tenant ID: ${school.id})`);
    } else {
        school = existingSchool;
        console.log(`⏭️  Skipped: demo school (already exists)`);
        console.log(`   Tenant ID: ${school.id}`);
    }

    console.log('\\n✅ Database seeding completed!\\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 LOGIN CREDENTIALS');
    console.log('═══════════════════════════════════════════════════════\\n');

    console.log('🔐 PLATFORM USERS (Click "Platform" tab):\\n');
    console.log('1. OWNER');
    console.log('   Email: owner@schoolcrm.com');
    console.log('   Password: owner123\\n');

    console.log('2. ADMIN');
    console.log('   Email: admin@schoolcrm.com');
    console.log('   Password: admin123\\n');

    console.log('3. SUPPORT');
    console.log('   Email: support@schoolcrm.com');
    console.log('   Password: support123\\n');

    console.log('4. SALES');
    console.log('   Email: sales@schoolcrm.com');
    console.log('   Password: sales123\\n');

    console.log('5. FINANCE');
    console.log('   Email: finance@schoolcrm.com');
    console.log('   Password: finance123\\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('🏫 SCHOOL USERS (Click "School" tab):\\n');
    console.log(`Tenant ID: ${school.id}`);
    console.log('Subdomain: demo\\n');
    console.log('Note: School users need to be created through the platform owner dashboard.');
    console.log('      Login as platform owner, go to Schools, and create school users.\\n');

    console.log('═══════════════════════════════════════════════════════');
    console.log('🚀 NEXT STEPS:\\n');
    console.log('1. Start backend: npm start');
    console.log('2. Start frontend: npm run dev');
    console.log('3. Login at: http://localhost:5173/login');
    console.log('4. Use platform owner credentials to access platform dashboard\\n');
    console.log('═══════════════════════════════════════════════════════\\n');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
