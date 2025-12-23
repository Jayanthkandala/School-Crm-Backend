/**
 * Middleware to provide default implementations for missing controller functions
 * This allows the server to start even if some controllers are incomplete
 */

const createStubFunction = (functionName, moduleName) => {
    return async (req, res) => {
        res.json({
            success: true,
            message: `${functionName} endpoint (${moduleName} module)`,
            data: {},
            note: 'This is a stub implementation. Full implementation coming soon.'
        });
    };
};

// Export stub functions for all modules
const stubs = {
    // Exams controller stubs
    exams: {
        getAllExams: createStubFunction('getAllExams', 'exams'),
        getExamById: createStubFunction('getExamById', 'exams'),
        createExam: createStubFunction('createExam', 'exams'),
        updateExam: createStubFunction('updateExam', 'exams'),
        deleteExam: createStubFunction('deleteExam', 'exams'),
        enterGrades: createStubFunction('enterGrades', 'exams'),
        getStudentGrades: createStubFunction('getStudentGrades', 'exams'),
        getExamGrades: createStubFunction('getExamGrades', 'exams'),
        generateReportCard: createStubFunction('generateReportCard', 'exams'),
        generateHallTicket: createStubFunction('generateHallTicket', 'exams'),
        getExamTimetable: createStubFunction('getExamTimetable', 'exams'),
        getToppers: createStubFunction('getToppers', 'exams'),
        getExamStats: createStubFunction('getExamStats', 'exams'),
        bulkImportGrades: createStubFunction('bulkImportGrades', 'exams'),
    },

    // Add more as needed
};

module.exports = { createStubFunction, stubs };
