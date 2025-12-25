const { Client } = require('pg');
const bcrypt = require('bcryptjs');

async function seedSchoolUsers() {
    console.log('🌱 Seeding School Users to school_demo database...\n');

    const client = new Client({
        host: 'localhost',
        port: 5432,
        database: 'school_demo',
        user: 'postgres',
        password: 'Jayanth'
    });

    try {
        await client.connect();
        console.log('✅ Connected to school_demo database\n');

        // School users to create
        const schoolUsers = [
            { fullName: 'School Admin', email: 'admin@demo.school', password: 'admin123', role: 'SCHOOL_ADMIN' },
            { fullName: 'John Teacher', email: 'teacher@demo.school', password: 'teacher123', role: 'TEACHER' },
            { fullName: 'Jane Student', email: 'student@demo.school', password: 'student123', role: 'STUDENT' },
            { fullName: 'Parent Smith', email: 'parent@demo.school', password: 'parent123', role: 'PARENT' },
            { fullName: 'Library Manager', email: 'librarian@demo.school', password: 'librarian123', role: 'LIBRARIAN' },
            { fullName: 'Account Manager', email: 'accountant@demo.school', password: 'accountant123', role: 'ACCOUNTANT' },
            { fullName: 'Front Desk', email: 'receptionist@demo.school', password: 'receptionist123', role: 'RECEPTIONIST' },
            { fullName: 'Transport Manager', email: 'transport@demo.school', password: 'transport123', role: 'TRANSPORT_MANAGER' }
        ];

        console.log('📊 Creating school users...\n');

        for (const userData of schoolUsers) {
            try {
                // Check if user exists
                const checkResult = await client.query('SELECT id FROM users WHERE email = $1', [userData.email]);

                if (checkResult.rows.length > 0) {
                    console.log(`⏭️  Skipped: ${userData.email} (already exists)`);
                    continue;
                }

                // Hash password
                const hashedPassword = await bcrypt.hash(userData.password, 10);

                // Insert user
                const insertResult = await client.query(
                    'INSERT INTO users (id, full_name, email, password_hash, role, is_active, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, true, NOW(), NOW()) RETURNING id',
                    [userData.fullName, userData.email, hashedPassword, userData.role]
                );

                const userId = insertResult.rows[0].id;
                console.log(`✅ Created: ${userData.fullName} (${userData.email}) - ${userData.role}`);

                // Create role-specific records
                if (userData.role === 'TEACHER') {
                    await client.query(
                        'INSERT INTO teachers (id, user_id, employee_id, qualification, experience, joining_date, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())',
                        [userId, 'TCH001', 'M.Sc Physics', 5, '2020-01-01']
                    );
                } else if (userData.role === 'STUDENT') {
                    // Get or create default class
                    let classResult = await client.query('SELECT id FROM classes LIMIT 1');
                    let classId;

                    if (classResult.rows.length === 0) {
                        const newClass = await client.query(
                            'INSERT INTO classes (id, class_name, section, academic_year, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW()) RETURNING id',
                            ['Class 10-A', 'A', '2024-2025']
                        );
                        classId = newClass.rows[0].id;
                    } else {
                        classId = classResult.rows[0].id;
                    }

                    await client.query(
                        'INSERT INTO students (id, user_id, class_id, admission_number, roll_number, admission_date, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())',
                        [userId, classId, 'STU001', '1', '2024-04-01']
                    );
                } else if (userData.role === 'PARENT') {
                    await client.query(
                        'INSERT INTO parents (id, user_id, occupation, phone, created_at, updated_at) VALUES (gen_random_uuid(), $1, $2, $3, NOW(), NOW())',
                        [userId, 'Engineer', '+91 9876543210']
                    );
                }

            } catch (error) {
                console.error(`❌ Error creating ${userData.email}:`, error.message);
            }
        }

        console.log('\n✅ School users seeding completed!\n');
        console.log('═══════════════════════════════════════════════════════');
        console.log('📝 SCHOOL LOGIN CREDENTIALS');
        console.log('═══════════════════════════════════════════════════════\n');
        console.log('🔐 Tenant ID: d0c3ea74-e646-4dd8-b8c5-3af97e408feb\n');
        console.log('1. SCHOOL ADMIN');
        console.log('   Email: admin@demo.school');
        console.log('   Password: admin123\n');
        console.log('2. TEACHER');
        console.log('   Email: teacher@demo.school');
        console.log('   Password: teacher123\n');
        console.log('3. STUDENT');
        console.log('   Email: student@demo.school');
        console.log('   Password: student123\n');
        console.log('4. PARENT');
        console.log('   Email: parent@demo.school');
        console.log('   Password: parent123\n');
        console.log('5. LIBRARIAN');
        console.log('   Email: librarian@demo.school');
        console.log('   Password: librarian123\n');
        console.log('6. ACCOUNTANT');
        console.log('   Email: accountant@demo.school');
        console.log('   Password: accountant123\n');
        console.log('7. RECEPTIONIST');
        console.log('   Email: receptionist@demo.school');
        console.log('   Password: receptionist123\n');
        console.log('8. TRANSPORT MANAGER');
        console.log('   Email: transport@demo.school');
        console.log('   Password: transport123\n');
        console.log('═══════════════════════════════════════════════════════\n');

    } catch (error) {
        console.error('❌ Error:', error);
        throw error;
    } finally {
        await client.end();
    }
}

seedSchoolUsers()
    .catch((e) => {
        console.error('❌ Fatal error:', e);
        process.exit(1);
    });
