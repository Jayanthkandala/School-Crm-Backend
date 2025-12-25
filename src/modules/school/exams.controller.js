const { getTenantPrismaClient } = require('../../utils/tenantDb');
const { calculateGrade, calculateCGPA } = require('../../utils/calculations');

const createExam = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { examName, examType, classId, startDate, endDate } = req.body;

        const exam = await tenantDb.exam.create({
            data: {
                examName,
                examType,
                classId,
                academicYear: new Date().getFullYear().toString(),
                startDate: new Date(startDate),
                endDate: new Date(endDate),
            },
        });

        res.status(201).json({ success: true, data: { exam } });
    } catch (error) {
        console.error('Create exam error:', error);
        res.status(500).json({ success: false, message: 'Failed to create exam', error: error.message });
    }
};

const addGrades = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { examId, grades } = req.body;

        for (const gradeData of grades) {
            const { percentage, grade, gradePoint } = calculateGrade(
                gradeData.marksObtained,
                gradeData.maxMarks
            );

            await tenantDb.grade.upsert({
                where: {
                    studentId_examId_subjectId: {
                        studentId: gradeData.studentId,
                        examId,
                        subjectId: gradeData.subjectId,
                    },
                },
                update: {
                    marksObtained: gradeData.marksObtained,
                    maxMarks: gradeData.maxMarks,
                    grade,
                    remarks: gradeData.remarks,
                },
                create: {
                    studentId: gradeData.studentId,
                    examId,
                    subjectId: gradeData.subjectId,
                    marksObtained: gradeData.marksObtained,
                    maxMarks: gradeData.maxMarks,
                    grade,
                    remarks: gradeData.remarks,
                },
            });
        }

        res.json({ success: true, message: 'Grades added successfully' });
    } catch (error) {
        console.error('Add grades error:', error);
        res.status(500).json({ success: false, message: 'Failed to add grades' });
    }
};

const getStudentGrades = async (req, res) => {
    try {
        const { studentId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const grades = await tenantDb.grade.findMany({
            where: { studentId },
            include: {
                exam: true,
                subject: true,
            },
            orderBy: { createdAt: 'desc' },
        });

        res.json({ success: true, data: { grades } });
    } catch (error) {
        console.error('Get grades error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch grades' });
    }
};

const getExamResults = async (req, res) => {
    try {
        const { examId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const results = await tenantDb.grade.findMany({
            where: { examId },
            include: {
                student: {
                    include: { user: { select: { fullName: true } } },
                },
                subject: true,
            },
        });

        res.json({ success: true, data: { results } });
    } catch (error) {
        console.error('Get results error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch results' });
    }
};





const getAllExams = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { page = 1, limit = 10, classId, examType, academicYear } = req.query;
        const skip = (page - 1) * limit;

        const where = {
            classId: classId || undefined,
            examType: examType || undefined,
            academicYear: academicYear || undefined
        };

        const [exams, total] = await Promise.all([
            tenantDb.exam.findMany({
                where,
                include: {
                    class: { select: { className: true, section: true } }
                },
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { startDate: 'desc' }
            }),
            tenantDb.exam.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                exams,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('getAllExams error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch exams' });
    }
};

const getExamById = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        const exam = await tenantDb.exam.findUnique({
            where: { id },
            include: {
                class: true,
                grades: {
                    include: {
                        student: { include: { user: { select: { fullName: true } } } },
                        subject: true
                    }
                }
            }
        });

        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }

        // Calculate statistics
        const totalStudents = await tenantDb.student.count({ where: { classId: exam.classId, status: 'ACTIVE' } });
        const studentsWithGrades = new Set(exam.grades.map(g => g.studentId)).size;

        res.json({
            success: true,
            data: {
                exam,
                stats: {
                    totalStudents,
                    studentsWithGrades,
                    completionPercentage: totalStudents > 0 ? Math.round((studentsWithGrades / totalStudents) * 100) : 0
                }
            }
        });
    } catch (error) {
        console.error('getExamById error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch exam' });
    }
};

const updateExam = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { examName, examType, startDate, endDate, totalMarks, passingMarks } = req.body;

        const exam = await tenantDb.exam.findUnique({ where: { id } });
        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }

        const updated = await tenantDb.exam.update({
            where: { id },
            data: {
                examName,
                examType,
                startDate: startDate ? new Date(startDate) : undefined,
                endDate: endDate ? new Date(endDate) : undefined,
                totalMarks,
                passingMarks
            }
        });

        res.json({ success: true, message: 'Exam updated successfully', data: { exam: updated } });
    } catch (error) {
        console.error('updateExam error:', error);
        res.status(500).json({ success: false, message: 'Failed to update exam' });
    }
};

const deleteExam = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        const exam = await tenantDb.exam.findUnique({
            where: { id },
            include: { grades: true }
        });

        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }

        // Check if grades exist
        if (exam.grades.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete exam with existing grades. Please delete grades first.'
            });
        }

        await tenantDb.exam.delete({ where: { id } });

        res.json({ success: true, message: 'Exam deleted successfully' });
    } catch (error) {
        console.error('deleteExam error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete exam' });
    }
};

const enterGrades = addGrades; // Alias for consistency

const getExamGrades = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { examId } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { subjectId } = req.query;

        const where = {
            examId,
            subjectId: subjectId || undefined
        };

        const grades = await tenantDb.grade.findMany({
            where,
            include: {
                student: { include: { user: { select: { fullName: true } } } },
                subject: true
            },
            orderBy: { marksObtained: 'desc' }
        });

        res.json({ success: true, data: { grades } });
    } catch (error) {
        console.error('getExamGrades error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch grades' });
    }
};

const { generateReportCardPDF, generateHallTicketPDF } = require('../../utils/pdfGenerator');
const fs = require('fs');
const path = require('path');

const generateReportCard = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { studentId, examId } = req.params;
        const { download } = req.query;
        const tenantDb = getTenantPrismaClient(tenantId);

        const [student, exam, grades, attendance] = await Promise.all([
            tenantDb.student.findUnique({
                where: { id: studentId },
                include: {
                    user: true,
                    class: true
                }
            }),
            tenantDb.exam.findUnique({
                where: { id: examId }
            }),
            tenantDb.grade.findMany({
                where: { studentId, examId },
                include: { subject: true }
            }),
            tenantDb.attendance.findMany({
                where: { studentId },
                select: { status: true }
            })
        ]);

        if (!student || !exam) {
            return res.status(404).json({ success: false, message: 'Student or Exam not found' });
        }

        // Calculate totals
        let totalMarks = 0;
        let obtainedMarks = 0;
        grades.forEach(grade => {
            totalMarks += grade.maxMarks;
            obtainedMarks += parseFloat(grade.marksObtained);
        });

        const percentage = totalMarks > 0 ? ((obtainedMarks / totalMarks) * 100).toFixed(2) : 0;

        // Calculate attendance
        const totalDays = attendance.length;
        const presentDays = attendance.filter(a => a.status === 'PRESENT').length;
        const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

        const reportData = {
            student: {
                name: student.user.fullName,
                admissionNumber: student.admissionNumber,
                class: `${student.class.className} - ${student.class.section}`,
                rollNumber: student.rollNumber
            },
            exam: {
                name: exam.examName,
                type: exam.examType,
                academicYear: exam.academicYear
            },
            grades: grades.map(g => ({
                subject: g.subject.subjectName,
                maxMarks: g.maxMarks,
                obtainedMarks: parseFloat(g.marksObtained),
                grade: g.grade,
                remarks: g.remarks
            })),
            summary: {
                totalMarks,
                obtainedMarks,
                percentage,
                result: percentage >= 40 ? 'PASS' : 'FAIL'
            },
            attendance: {
                totalDays,
                presentDays,
                percentage: attendancePercentage
            }
        };

        // Generate PDF
        const { filepath, filename } = await generateReportCardPDF(reportData);

        if (download === 'true') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            const fileStream = fs.createReadStream(filepath);
            fileStream.pipe(res);
        } else {
            res.json({
                success: true,
                data: {
                    pdfUrl: `/uploads/reports/${filename}`,
                    pdfPath: filepath,
                    reportCard: reportData // Also return JSON for preview if needed
                },
                message: 'Report card generated successfully'
            });
        }
    } catch (error) {
        console.error('generateReportCard error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate report card' });
    }
};

const generateHallTicket = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { studentId, examId } = req.params;
        const { download } = req.query; // Check for download flag
        const tenantDb = getTenantPrismaClient(tenantId);

        const [student, exam] = await Promise.all([
            tenantDb.student.findUnique({
                where: { id: studentId },
                include: {
                    user: true,
                    class: true
                }
            }),
            tenantDb.exam.findUnique({
                where: { id: examId },
                include: {
                    class: true
                }
            })
        ]);

        if (!student || !exam) {
            return res.status(404).json({ success: false, message: 'Student or Exam not found' });
        }

        // Get Timetable for this exam
        const scheduleEntries = await tenantDb.timetableEntry.findMany({
            where: {
                classId: student.classId,
            },
            include: { subject: true }
        });

        const schedule = [
            { date: exam.startDate, startTime: '09:00', endTime: '12:00', subject: 'Mathematics', room: 'Hall 1' },
            { date: new Date(new Date(exam.startDate).setDate(new Date(exam.startDate).getDate() + 1)), startTime: '09:00', endTime: '12:00', subject: 'Science', room: 'Hall 2' }
        ];

        const ticketData = {
            schoolName: 'SCHOOL CRM DEMO', // TODO: Get from settings
            student: {
                name: student.user.fullName,
                admissionNumber: student.admissionNumber,
                class: `${student.class.className} - ${student.class.section}`,
                rollNumber: student.rollNumber,
                photo: student.user.profilePhotoUrl
            },
            exam: {
                name: exam.examName,
                type: exam.examType,
                academicYear: exam.academicYear,
                startDate: exam.startDate,
                endDate: exam.endDate
            },
            schedule: schedule,
            instructions: [
                'Bring this hall ticket to the examination hall',
                'Arrive 15 minutes before the exam starts',
                'Carry a valid ID proof',
                'Electronic devices are not allowed'
            ]
        };

        // Generate PDF
        const { filepath, filename } = await generateHallTicketPDF(ticketData);

        if (download === 'true') {
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
            const fileStream = fs.createReadStream(filepath);
            fileStream.pipe(res);
        } else {
            res.json({
                success: true,
                data: {
                    pdfUrl: `/uploads/reports/${filename}`,
                    pdfPath: filepath,
                    hallTicket: ticketData
                },
                message: 'Hall ticket generated successfully'
            });
        }
    } catch (error) {
        console.error('generateHallTicket error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate hall ticket' });
    }
};

const getExamTimetable = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { examId } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        const exam = await tenantDb.exam.findUnique({
            where: { id: examId },
            include: {
                class: true
            }
        });

        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }

        const timetable = {
            exam: {
                name: exam.examName,
                class: `${exam.class.className} - ${exam.class.section}`,
                academicYear: exam.academicYear
            },
            schedule: []
        };

        res.json({ success: true, data: { timetable } });
    } catch (error) {
        console.error('getExamTimetable error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch timetable' });
    }
};

const getToppers = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { examId } = req.params;
        const { limit = 10 } = req.query;
        const tenantDb = getTenantPrismaClient(tenantId);

        const grades = await tenantDb.grade.findMany({
            where: { examId },
            include: {
                student: { include: { user: { select: { fullName: true } } } },
                subject: true
            }
        });

        // Group by student and calculate total
        const studentTotals = {};
        grades.forEach(grade => {
            if (!studentTotals[grade.studentId]) {
                studentTotals[grade.studentId] = {
                    studentId: grade.studentId,
                    studentName: grade.student.user.fullName,
                    admissionNumber: grade.student.admissionNumber,
                    totalMarks: 0,
                    obtainedMarks: 0,
                    subjects: []
                };
            }
            studentTotals[grade.studentId].totalMarks += grade.maxMarks;
            studentTotals[grade.studentId].obtainedMarks += parseFloat(grade.marksObtained);
            studentTotals[grade.studentId].subjects.push({
                subject: grade.subject.subjectName,
                marks: parseFloat(grade.marksObtained),
                maxMarks: grade.maxMarks
            });
        });

        // Calculate percentage and sort
        const toppers = Object.values(studentTotals)
            .map(student => ({
                ...student,
                percentage: student.totalMarks > 0
                    ? ((student.obtainedMarks / student.totalMarks) * 100).toFixed(2)
                    : 0
            }))
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, parseInt(limit))
            .map((student, index) => ({
                rank: index + 1,
                ...student
            }));

        res.json({ success: true, data: { toppers } });
    } catch (error) {
        console.error('getToppers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch toppers' });
    }
};

const getExamStats = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { examId } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        const [exam, grades] = await Promise.all([
            tenantDb.exam.findUnique({
                where: { id: examId },
                include: { class: true }
            }),
            tenantDb.grade.findMany({
                where: { examId },
                include: { subject: true }
            })
        ]);

        if (!exam) {
            return res.status(404).json({ success: false, message: 'Exam not found' });
        }

        // Subject-wise statistics
        const subjectStats = {};
        grades.forEach(grade => {
            const subjectId = grade.subjectId;
            if (!subjectStats[subjectId]) {
                subjectStats[subjectId] = {
                    subjectName: grade.subject.subjectName,
                    totalStudents: 0,
                    totalMarks: 0,
                    maxMarks: grade.maxMarks,
                    highest: 0,
                    lowest: grade.maxMarks,
                    passed: 0,
                    failed: 0
                };
            }
            const marks = parseFloat(grade.marksObtained);
            subjectStats[subjectId].totalStudents++;
            subjectStats[subjectId].totalMarks += marks;
            subjectStats[subjectId].highest = Math.max(subjectStats[subjectId].highest, marks);
            subjectStats[subjectId].lowest = Math.min(subjectStats[subjectId].lowest, marks);

            const passingMarks = grade.maxMarks * 0.4; // 40% passing
            if (marks >= passingMarks) {
                subjectStats[subjectId].passed++;
            } else {
                subjectStats[subjectId].failed++;
            }
        });

        // Calculate averages and percentages
        const stats = Object.values(subjectStats).map(subject => ({
            ...subject,
            average: (subject.totalMarks / subject.totalStudents).toFixed(2),
            passPercentage: ((subject.passed / subject.totalStudents) * 100).toFixed(2)
        }));

        res.json({
            success: true,
            data: {
                exam: {
                    name: exam.examName,
                    class: `${exam.class.className} - ${exam.class.section}`
                },
                stats
            }
        });
    } catch (error) {
        console.error('getExamStats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch statistics' });
    }
};

const bulkImportGrades = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { examId, grades } = req.body;

        if (!Array.isArray(grades) || grades.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid grades data' });
        }

        let imported = 0;
        const errors = [];

        for (const gradeData of grades) {
            try {
                const { percentage, grade, gradePoint } = calculateGrade(
                    gradeData.marksObtained,
                    gradeData.maxMarks
                );

                await tenantDb.grade.upsert({
                    where: {
                        studentId_examId_subjectId: {
                            studentId: gradeData.studentId,
                            examId,
                            subjectId: gradeData.subjectId
                        }
                    },
                    update: {
                        marksObtained: gradeData.marksObtained,
                        maxMarks: gradeData.maxMarks,
                        grade,
                        remarks: gradeData.remarks
                    },
                    create: {
                        studentId: gradeData.studentId,
                        examId,
                        subjectId: gradeData.subjectId,
                        marksObtained: gradeData.marksObtained,
                        maxMarks: gradeData.maxMarks,
                        grade,
                        remarks: gradeData.remarks
                    }
                });
                imported++;
            } catch (error) {
                errors.push({
                    studentId: gradeData.studentId,
                    subjectId: gradeData.subjectId,
                    error: error.message
                });
            }
        }

        res.json({
            success: true,
            message: 'Bulk import completed',
            data: {
                imported,
                failed: errors.length,
                errors
            }
        });
    } catch (error) {
        console.error('bulkImportGrades error:', error);
        res.status(500).json({ success: false, message: 'Failed to import grades' });
    }
};
module.exports = {
    createExam,
    addGrades,
    getStudentGrades,
    getExamResults,
    getAllExams,
    getExamById,
    updateExam,
    deleteExam,
    enterGrades,
    getExamGrades,
    generateReportCard,
    generateHallTicket,
    getExamTimetable,
    getToppers,
    getExamStats,
    bulkImportGrades,
};
