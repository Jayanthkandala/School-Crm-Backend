const { getTenantPrismaClient } = require('../src/utils/tenantDb');
const { hashPassword } = require('../src/utils/encryption.util');

// This seeds data for a specific school tenant
// Usage: node prisma/seed-tenant.js <tenantId>

async function seedTenantData(tenantId) {
    console.log(`🌱 Seeding data for tenant: ${tenantId}\n`);

    const prisma = getTenantPrismaClient(tenantId);

    try {
        // 1. Create Classes
        console.log('Creating classes...');

        let class10A, class10B, class9A;

        try {
            class10A = await prisma.class.create({
                data: {
                    className: 'Class 10',
                    section: 'A',
                    academicYear: '2025-2026',
                    capacity: 40
                }
            });
        } catch (e) {
            class10A = await prisma.class.findFirst({
                where: { className: 'Class 10', section: 'A' }
            });
        }

        try {
            class10B = await prisma.class.create({
                data: {
                    className: 'Class 10',
                    section: 'B',
                    academicYear: '2025-2026',
                    capacity: 40
                }
            });
        } catch (e) {
            class10B = await prisma.class.findFirst({
                where: { className: 'Class 10', section: 'B' }
            });
        }

        try {
            class9A = await prisma.class.create({
                data: {
                    className: 'Class 9',
                    section: 'A',
                    academicYear: '2025-2026',
                    capacity: 40
                }
            });
        } catch (e) {
            class9A = await prisma.class.findFirst({
                where: { className: 'Class 9', section: 'A' }
            });
        }

        console.log('✅ Created 3 classes\n');

        // 2. Create Subjects
        console.log('Creating subjects...');
        const subjects = [];

        const subjectData = [
            { subjectName: 'Mathematics', subjectCode: 'MATH' },
            { subjectName: 'Science', subjectCode: 'SCI' },
            { subjectName: 'English', subjectCode: 'ENG' },
            { subjectName: 'History', subjectCode: 'HIST' },
            { subjectName: 'Geography', subjectCode: 'GEO' }
        ];

        for (const sub of subjectData) {
            try {
                const subject = await prisma.subject.create({ data: sub });
                subjects.push(subject);
            } catch (e) {
                const existing = await prisma.subject.findFirst({
                    where: { subjectCode: sub.subjectCode }
                });
                if (existing) subjects.push(existing);
            }
        }

        console.log('✅ Created 5 subjects\n');

        // 3. Create Teachers
        console.log('Creating teachers...');
        const passwordHash = await hashPassword('Teacher@123');

        const teachers = [];
        for (let i = 1; i <= 5; i++) {
            const email = `teacher${i}@school.com`;

            // Check if user exists
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (!existingUser) {
                const user = await prisma.user.create({
                    data: {
                        fullName: `Teacher ${i}`,
                        email,
                        phone: `98765432${i}0`,
                        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
                        dateOfBirth: new Date('1985-01-15'),
                        passwordHash,
                        role: 'TEACHER'
                    }
                });

                const teacher = await prisma.teacher.create({
                    data: {
                        userId: user.id,
                        employeeId: `EMP00${i}`,
                        joiningDate: new Date('2020-06-01'),
                        qualification: 'M.Sc',
                        specialization: i === 1 ? 'Mathematics' : i === 2 ? 'Science' : i === 3 ? 'English' : i === 4 ? 'History' : 'Geography',
                        experience: 5 + i
                    }
                });

                teachers.push(teacher);
            }
        }
        console.log(`✅ Created ${teachers.length} teachers\n`);

        // 4. Create Students
        console.log('Creating students...');
        const students = [];
        const classes = [class10A, class10B, class9A];

        for (let i = 1; i <= 15; i++) {
            const email = `student${i}@school.com`;

            // Check if user exists
            const existingUser = await prisma.user.findUnique({ where: { email } });

            if (!existingUser) {
                const classIndex = i % 3;
                const selectedClass = classes[classIndex];

                const user = await prisma.user.create({
                    data: {
                        fullName: `Student ${i}`,
                        email,
                        phone: `87654321${i < 10 ? '0' + i : i}`,
                        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
                        dateOfBirth: new Date('2010-01-15'),
                        passwordHash,
                        role: 'STUDENT'
                    }
                });

                const student = await prisma.student.create({
                    data: {
                        userId: user.id,
                        admissionNumber: `ADM${String(i).padStart(4, '0')}`,
                        admissionDate: new Date('2024-04-01'),
                        classId: selectedClass.id,
                        rollNumber: String(i),
                        gender: i % 2 === 0 ? 'MALE' : 'FEMALE',
                        dateOfBirth: new Date('2010-01-15'),
                        bloodGroup: i % 4 === 0 ? 'A+' : i % 4 === 1 ? 'B+' : i % 4 === 2 ? 'O+' : 'AB+',
                        address: `Address ${i}, City`,
                        city: 'Mumbai',
                        state: 'Maharashtra'
                    }
                });

                students.push(student);
            }
        }
        console.log(`✅ Created ${students.length} students\n`);

        console.log('🎉 Tenant data seeding completed!\n');
        console.log('📋 Summary:');
        console.log(`   - Classes: 3`);
        console.log(`   - Subjects: 5`);
        console.log(`   - Teachers: ${teachers.length}`);
        console.log(`   - Students: ${students.length}`);
        console.log('\n✅ You can now test the application!\n');

    } catch (error) {
        console.error('❌ Seeding failed:', error);
        throw error;
    }
}

// Get tenantId from command line or use default
const tenantId = process.argv[2] || 'school_demo';

seedTenantData(tenantId)
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(() => {
        process.exit(0);
    });
