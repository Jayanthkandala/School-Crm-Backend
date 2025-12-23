// Test loading each route file individually
console.log('Testing route files...\n');

const routes = [
    // './dashboard.routes',
    './students.routes',
    './teachers.routes',
    './classes.routes',
    './attendance.routes',
    './exams.routes',
    './fees.routes',
    './library.routes',
    './communication.routes',
    './timetable.routes',
    './certificates.routes',
    './transport.routes',
    './reports.routes',
    './settings.routes',
    './users.routes',
    './parents.routes',
    './assignments.routes',
    './admissions.routes',
    './accountant.routes',
];

for (const route of routes) {
    try {
        console.log(`Loading ${route}...`);
        require(route);
        console.log(`✅ ${route} loaded successfully\n`);
    } catch (error) {
        console.error(`❌ Error loading ${route}:`);
        console.error(error.message);
        console.error('\n');
        process.exit(1);
    }
}

console.log('✅ All routes loaded successfully!');
