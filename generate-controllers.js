// Auto-generate missing controller functions
const fs = require('fs');
const path = require('path');

const controllerFunctions = {
    'exams.controller.js': ['getAllExams', 'getExamById', 'createExam', 'updateExam', 'deleteExam', 'enterGrades', 'getStudentGrades', 'getExamGrades', 'generateReportCard', 'generateHallTicket', 'getExamTimetable', 'getToppers', 'getExamStats', 'bulkImportGrades'],
    'accountant.controller.js': ['getDashboard', 'getTodayCollection', 'getAllExpenses', 'createExpense', 'updateExpense', 'deleteExpense', 'getExpenseReport', 'getAllSalaries', 'generateSalarySlips', 'getSalarySlip', 'getProfitLossReport', 'getBalanceSheet', 'getCashFlowReport', 'bankReconciliation'],
    'admissions.controller.js': ['createApplication', 'getAllApplications', 'getAdmissionStats', 'getApplicationById', 'updateApplication', 'approveApplication', 'rejectApplication', 'uploadDocuments', 'scheduleInterview'],
    'assignments.controller.js': ['getAllAssignments', 'getMyAssignments', 'getAssignmentById', 'createAssignment', 'updateAssignment', 'deleteAssignment', 'getSubmissions', 'gradeSubmission', 'getAssignmentStats', 'bulkGrade'],
    'certificates.controller.js': ['requestCertificate', 'getAllCertificates', 'generateCertificate', 'verifyCertificate', 'downloadCertificate'],
    'communication.controller.js': ['getAllAnnouncements', 'createAnnouncement', 'publishAnnouncement', 'getAllEvents', 'createEvent', 'sendMessage', 'sendBulkMessage'],
    'library.controller.js': ['getAllBooks', 'createBook', 'updateBook', 'deleteBook', 'issueBook', 'returnBook', 'renewBook', 'reserveBook', 'getOverdueBooks', 'getStudentHistory', 'getLibraryStats'],
    'timetable.controller.js': ['getClassTimetable', 'createTimetableEntry', 'updateTimetableEntry', 'deleteTimetableEntry', 'bulkCreateTimetable'],
    'transport.controller.js': ['getAllRoutes', 'createRoute', 'updateRoute', 'deleteRoute', 'assignStudentToRoute', 'getRouteStudents', 'getTransportStats'],
};

Object.entries(controllerFunctions).forEach(([filename, functions]) => {
    const filePath = path.join(__dirname, 'src', 'modules', 'school', filename);

    // Check if file exists and read it
    let existingContent = '';
    let existingFunctions = [];

    if (fs.existsSync(filePath)) {
        existingContent = fs.readFileSync(filePath, 'utf8');
        // Extract existing function names
        const matches = existingContent.matchAll(/const (\w+) = async/g);
        existingFunctions = Array.from(matches, m => m[1]);
    }

    // Find missing functions
    const missingFunctions = functions.filter(f => !existingFunctions.includes(f));

    if (missingFunctions.length === 0) {
        console.log(`✅ ${filename} - All functions present`);
        return;
    }

    console.log(`⚠️  ${filename} - Missing: ${missingFunctions.join(', ')}`);

    // Generate stub functions
    const stubCode = missingFunctions.map(funcName => `
const ${funcName} = async (req, res) => {
    try {
        res.json({ 
            success: true, 
            message: '${funcName} endpoint',
            data: {} 
        });
    } catch (error) {
        console.error('${funcName} error:', error);
        res.status(500).json({ success: false, message: 'Operation failed' });
    }
};`).join('\n');

    // Update exports
    const allFunctions = [...existingFunctions, ...missingFunctions];
    const exportsCode = `\nmodule.exports = {\n    ${allFunctions.join(',\n    ')},\n};\n`;

    // If file doesn't exist, create it
    if (!fs.existsSync(filePath)) {
        const fullContent = `const { getTenantPrismaClient } = require('../../utils/tenantDb');\n${stubCode}${exportsCode}`;
        fs.writeFileSync(filePath, fullContent);
        console.log(`   ✅ Created ${filename}`);
    } else {
        // Append to existing file
        const updatedContent = existingContent.replace(/module\.exports = \{[^}]+\};?/, '') + stubCode + exportsCode;
        fs.writeFileSync(filePath, updatedContent);
        console.log(`   ✅ Updated ${filename}`);
    }
});

console.log('\n✅ Controller generation complete!');
