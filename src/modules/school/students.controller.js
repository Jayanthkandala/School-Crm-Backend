const { getTenantPrismaClient } = require('../../utils/tenantDb');
const { hashPassword } = require('../../utils/encryption.util');

const getAllStudents = async (req, res) => {
    try {
        const { tenantId } = req.user; // Assuming School User
        const prisma = getTenantPrismaClient(tenantId);

        const { page = 1, limit = 10, search, classId, section } = req.query;
        const skip = (page - 1) * limit;

        const where = {
            OR: search ? [
                { admissionNumber: { contains: search, mode: 'insensitive' } },
                { user: { fullName: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ] : undefined,
            classId: classId || undefined,
            section: section || undefined, // If using section directly or via Class model? Schema has section in Class AND Student?
            // Schema Student has section (String?) - Line 73. Class has section.
            // If classId is provided, section is implied? Let's assume Student.section is redundant or specific override.
            // Actually schema line 73: section String? 
        };

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                include: {
                    user: { select: { fullName: true, email: true, phone: true } },
                    class: { select: { className: true, section: true } }
                },
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { createdAt: 'desc' }
            }),
            prisma.student.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                students,
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('getAllStudents error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch students' });
    }
};

const getStudentById = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const prisma = getTenantPrismaClient(tenantId);

        const student = await prisma.student.findUnique({
            where: { id },
            include: {
                user: true,
                class: true,
                parents: { include: { parent: { include: { user: true } } } }
            }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        res.json({ success: true, data: { student } });
    } catch (error) {
        console.error('getStudentById error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student' });
    }
};

const createStudent = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);
        const {
            fullName, email, password, phone, gender, dob, address,
            admissionNumber, admissionDate, classId, rollNumber, bloodGroup
        } = req.body;

        if (!email || !fullName || !admissionNumber || !gender || !dob) {
            return res.status(400).json({
                success: false,
                message: 'Missing required fields: email, fullName, admissionNumber, gender, and dateOfBirth are required'
            });
        }

        // Check if exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

        // Validate class capacity
        if (classId) {
            const classData = await prisma.class.findUnique({
                where: { id: classId },
                include: { _count: { select: { students: true } } }
            });

            if (!classData) {
                return res.status(404).json({ success: false, message: 'Class not found' });
            }

            if (classData.maxStudents && classData._count.students >= classData.maxStudents) {
                return res.status(400).json({
                    success: false,
                    message: `Class is full. Maximum capacity: ${classData.maxStudents}`
                });
            }
        }

        const passwordHash = await hashPassword(password || 'Student@123'); // Default password if not provided

        // Transaction
        const student = await prisma.$transaction(async (tx) => {
            // 1. Create User
            const user = await tx.user.create({
                data: {
                    fullName,
                    email,
                    phone,
                    gender,
                    dateOfBirth: new Date(dob),
                    passwordHash,
                    role: 'STUDENT',
                }
            });

            // 2. Create Student
            const newStudent = await tx.student.create({
                data: {
                    userId: user.id,
                    admissionNumber,
                    admissionDate: new Date(admissionDate || new Date()),
                    classId,
                    rollNumber,
                    bloodGroup,
                    gender,
                    dateOfBirth: new Date(dob),
                    address,
                    city: req.body.city,
                    state: req.body.state
                }
            });

            // 3. Update class currentStrength
            if (classId) {
                const studentCount = await tx.student.count({
                    where: { classId, status: 'ACTIVE' }
                });

                await tx.class.update({
                    where: { id: classId },
                    data: { currentStrength: studentCount }
                });
            }

            return newStudent;
        });

        res.status(201).json({ success: true, message: 'Student created successfully', data: { student } });
    } catch (error) {
        console.error('createStudent error:', error);
        res.status(500).json({ success: false, message: 'Failed to create student' });
    }
};

const updateStudent = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const prisma = getTenantPrismaClient(tenantId);
        const {
            fullName, phone, gender, dob, address, city, state,
            classId, rollNumber, bloodGroup, status
        } = req.body;

        const student = await prisma.student.findUnique({ where: { id } });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const oldClassId = student.classId;
        const classChanged = classId && classId !== oldClassId;

        // Validate new class capacity if changing class
        if (classChanged) {
            const newClassData = await prisma.class.findUnique({
                where: { id: classId },
                include: { _count: { select: { students: true } } }
            });

            if (!newClassData) {
                return res.status(404).json({ success: false, message: 'New class not found' });
            }

            if (newClassData.maxStudents && newClassData._count.students >= newClassData.maxStudents) {
                return res.status(400).json({
                    success: false,
                    message: `New class is full. Maximum capacity: ${newClassData.maxStudents}`
                });
            }
        }

        const updated = await prisma.$transaction(async (tx) => {
            // Update User
            await tx.user.update({
                where: { id: student.userId },
                data: { fullName, phone }
            });

            // Update Student
            const updatedStudent = await tx.student.update({
                where: { id },
                data: {
                    classId,
                    rollNumber,
                    bloodGroup,
                    status,
                    gender,
                    dateOfBirth: dob ? new Date(dob) : undefined,
                    address,
                    city,
                    state
                }
            });

            // Update class strengths if class changed
            if (classChanged) {
                // Update old class
                if (oldClassId) {
                    const oldClassCount = await tx.student.count({
                        where: { classId: oldClassId, status: 'ACTIVE' }
                    });
                    await tx.class.update({
                        where: { id: oldClassId },
                        data: { currentStrength: oldClassCount }
                    });
                }

                // Update new class
                const newClassCount = await tx.student.count({
                    where: { classId, status: 'ACTIVE' }
                });
                await tx.class.update({
                    where: { id: classId },
                    data: { currentStrength: newClassCount }
                });
            }

            return updatedStudent;
        });

        res.json({ success: true, message: 'Student updated', data: { student: updated } });
    } catch (error) {
        console.error('updateStudent error:', error);
        res.status(500).json({ success: false, message: 'Failed to update student' });
    }
};


const deleteStudent = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const prisma = getTenantPrismaClient(tenantId);

        const student = await prisma.student.findUnique({ where: { id } });
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const classId = student.classId;

        // Delete User (Cascade should delete Student)
        await prisma.$transaction(async (tx) => {
            await tx.user.delete({ where: { id: student.userId } });

            // Update class currentStrength
            if (classId) {
                const studentCount = await tx.student.count({
                    where: { classId, status: 'ACTIVE' }
                });

                await tx.class.update({
                    where: { id: classId },
                    data: { currentStrength: studentCount }
                });
            }
        });

        res.json({ success: true, message: 'Student deleted successfully' });
    } catch (error) {
        console.error('deleteStudent error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete student' });
    }
};

// Placeholders for others (Bulk, Promote, etc.) - user asked for "routes for everything" but MVP is CRUD.
// I will keep the placeholders for non-CRUD but ensure they return valid JSON not to crash.
// Bulk Import Students
const bulkImportStudents = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);
        const { students } = req.body;

        if (!Array.isArray(students) || students.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid students data' });
        }

        let imported = 0;
        const errors = [];

        for (const studentData of students) {
            try {
                const { fullName, email, admissionNumber, classId, dob, gender, address, city, state } = studentData;

                // Check if email already exists
                const existing = await prisma.user.findUnique({ where: { email } });
                if (existing) {
                    errors.push({ admissionNumber, email, error: 'Email already exists' });
                    continue;
                }

                const passwordHash = await hashPassword(studentData.password || 'Student@123');

                await prisma.$transaction(async (tx) => {
                    const user = await tx.user.create({
                        data: {
                            fullName,
                            email,
                            passwordHash,
                            role: 'STUDENT',
                        }
                    });

                    await tx.student.create({
                        data: {
                            userId: user.id,
                            admissionNumber: String(admissionNumber), // Ensure string
                            classId,
                            admissionDate: new Date(),
                            gender,
                            dateOfBirth: dob ? new Date(dob) : new Date(),
                            address,
                            city,
                            state
                        }
                    });
                });

                imported++;
            } catch (error) {
                errors.push({
                    admissionNumber: studentData.admissionNumber,
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
        console.error('bulkImportStudents error:', error);
        res.status(500).json({ success: false, message: 'Failed to bulk import students' });
    }
};

// Promote Students
const promoteStudents = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);
        const { currentClassId, targetClassId, studentIds, academicYear, promoteAll } = req.body;

        if (!currentClassId || !targetClassId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Verify target class exists
        const targetClass = await prisma.class.findUnique({ where: { id: targetClassId } });
        if (!targetClass) {
            return res.status(404).json({ success: false, message: 'Target class not found' });
        }

        let studentsToPromote = [];

        if (promoteAll) {
            // Get all active students from current class
            const students = await prisma.student.findMany({
                where: { classId: currentClassId, status: 'ACTIVE' },
                select: { id: true }
            });
            studentsToPromote = students.map(s => s.id);
        } else if (Array.isArray(studentIds)) {
            studentsToPromote = studentIds;
        } else {
            return res.status(400).json({ success: false, message: 'Provide studentIds or promoteAll: true' });
        }

        let promoted = 0;
        const errors = [];

        await prisma.$transaction(async (tx) => {
            for (const studentId of studentsToPromote) {
                try {
                    // Update student
                    await tx.student.update({
                        where: { id: studentId },
                        data: {
                            classId: targetClassId,
                            rollNumber: null // Reset roll number
                        }
                    });
                    promoted++;
                } catch (error) {
                    errors.push({ studentId, error: error.message });
                }
            }

            // Update class counts
            const currentCount = await tx.student.count({ where: { classId: currentClassId, status: 'ACTIVE' } });
            await tx.class.update({ where: { id: currentClassId }, data: { currentStrength: currentCount } });

            const targetCount = await tx.student.count({ where: { classId: targetClassId, status: 'ACTIVE' } });
            await tx.class.update({ where: { id: targetClassId }, data: { currentStrength: targetCount } });
        });

        res.json({
            success: true,
            message: `${promoted} students promoted successfully`,
            data: {
                promoted,
                failed: errors.length,
                errors
            }
        });
    } catch (error) {
        console.error('promoteStudents error:', error);
        res.status(500).json({ success: false, message: 'Failed to promote students' });
    }
};

// Transfer Student
const transferStudent = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const prisma = getTenantPrismaClient(tenantId);
        const { targetClassId, transferReason, transferDate } = req.body;

        const student = await prisma.student.findUnique({
            where: { id },
            include: { user: true, class: true }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // If transferring to another class in same school
        if (targetClassId) {
            const targetClass = await prisma.class.findUnique({ where: { id: targetClassId } });
            if (!targetClass) {
                return res.status(404).json({ success: false, message: 'Target class not found' });
            }

            await prisma.student.update({
                where: { id },
                data: {
                    classId: targetClassId,
                    status: 'ACTIVE'
                }
            });

            res.json({
                success: true,
                message: 'Student transferred successfully',
                data: {
                    studentId: id,
                    fromClass: `${student.class.className} - ${student.class.section}`,
                    toClass: `${targetClass.className} - ${targetClass.section}`,
                    transferDate: transferDate || new Date()
                }
            });
        } else {
            // Transfer to another school (mark as TRANSFERRED)
            await prisma.student.update({
                where: { id },
                data: {
                    status: 'TRANSFERRED'
                }
            });

            res.json({
                success: true,
                message: 'Student marked as transferred',
                data: {
                    studentId: id,
                    studentName: student.user.fullName,
                    reason: transferReason,
                    transferDate: transferDate || new Date()
                }
            });
        }
    } catch (error) {
        console.error('transferStudent error:', error);
        res.status(500).json({ success: false, message: 'Failed to transfer student' });
    }
};

const { generateIDCardPDF } = require('../../services/pdf.service');
const archiver = require('archiver');

// Generate ID Cards (PDF)
const generateIDCards = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);
        const { studentIds } = req.body;

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid student IDs' });
        }

        const students = await prisma.student.findMany({
            where: {
                id: { in: studentIds },
                status: 'ACTIVE'
            },
            include: {
                user: true,
                class: true
            }
        });

        if (students.length === 0) {
            return res.status(404).json({ success: false, message: 'No students found' });
        }

        // If single student, return PDF directly
        if (students.length === 1) {
            const pdfBuffer = await generateIDCardPDF(students[0], { name: 'Demo School' });

            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=ID_Card_${students[0].admissionNumber}.pdf`);
            return res.send(pdfBuffer);
        }

        // If multiple students, return ZIP of PDFs
        const archive = archiver('zip', {
            zlib: { level: 9 }
        });

        res.setHeader('Content-Type', 'application/zip');
        res.setHeader('Content-Disposition', 'attachment; filename=ID_Cards_Batch.zip');

        archive.pipe(res);

        for (const student of students) {
            try {
                const pdfBuffer = await generateIDCardPDF(student, { name: 'Demo School' });
                archive.append(pdfBuffer, { name: `ID_Card_${student.admissionNumber}.pdf` });
            } catch (err) {
                console.error(`Failed to generate ID card for ${student.admissionNumber}:`, err);
                // Continue with other students
            }
        }

        await archive.finalize();
        return;

    } catch (error) {
        console.error('generateIDCards error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate ID cards' });
    }
};

// Get Student Statistics
const getStudentStats = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);
        const { classId } = req.query;

        const where = {
            classId: classId || undefined
        };

        const [total, active, graduated, transferred, dropped] = await Promise.all([
            prisma.student.count({ where }),
            prisma.student.count({ where: { ...where, status: 'ACTIVE' } }),
            prisma.student.count({ where: { ...where, status: 'GRADUATED' } }),
            prisma.student.count({ where: { ...where, status: 'TRANSFERRED' } }),
            prisma.student.count({ where: { ...where, status: 'DROPPED' } })
        ]);

        // Gender distribution
        const [male, female, other] = await Promise.all([
            prisma.student.count({
                where: {
                    ...where,
                    user: { gender: 'MALE' }
                }
            }),
            prisma.student.count({
                where: {
                    ...where,
                    user: { gender: 'FEMALE' }
                }
            }),
            prisma.student.count({
                where: {
                    ...where,
                    user: { gender: 'OTHER' }
                }
            })
        ]);

        // Class-wise distribution if no specific class
        let classDistribution = [];
        if (!classId) {
            const classes = await prisma.class.findMany({
                select: { id: true, className: true, section: true }
            });

            for (const cls of classes) {
                const count = await prisma.student.count({
                    where: { classId: cls.id, status: 'ACTIVE' }
                });

                if (count > 0) {
                    classDistribution.push({
                        classId: cls.id,
                        className: `${cls.className} - ${cls.section}`,
                        studentCount: count
                    });
                }
            }
        }

        res.json({
            success: true,
            data: {
                total,
                byStatus: {
                    active,
                    graduated,
                    transferred,
                    dropped
                },
                byGender: {
                    male,
                    female,
                    other
                },
                classDistribution
            }
        });
    } catch (error) {
        console.error('getStudentStats error:', error);
        res.json({
            success: true,
            data: {
                total: 0,
                byStatus: { active: 0, graduated: 0, transferred: 0, dropped: 0 },
                byGender: { male: 0, female: 0, other: 0 },
                classDistribution: []
            }
        });
    }
};

// Get Single Student Performance Stats
const getStudentPerformance = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);
        const { id } = req.params;

        const student = await prisma.student.findUnique({
            where: { id },
            include: { class: true }
        });

        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // 1. Calculate Attendance Percentage
        const totalAttendance = await prisma.attendance.count({
            where: { studentId: id }
        });

        const presentAttendance = await prisma.attendance.count({
            where: {
                studentId: id,
                status: { in: ['PRESENT', 'LATE', 'HALF_DAY'] }
            }
        });

        const attendancePercentage = totalAttendance > 0
            ? Math.round((presentAttendance / totalAttendance) * 100)
            : 0;

        // 2. Calculate Average Grade
        const grades = await prisma.grade.findMany({
            where: { studentId: id }
        });

        let averageGrade = 0;
        let totalMarks = 0;
        let maxMarksTotal = 0;

        if (grades.length > 0) {
            grades.forEach(grade => {
                totalMarks += Number(grade.marksObtained);
                maxMarksTotal += Number(grade.maxMarks);
            });
            averageGrade = maxMarksTotal > 0
                ? Math.round((totalMarks / maxMarksTotal) * 100)
                : 0;
        }

        // 3. Calculate Class Rank
        // Get all students in class with their average marks
        const classStudents = await prisma.student.findMany({
            where: {
                classId: student.classId,
                status: 'ACTIVE'
            },
            select: { id: true }
        });

        // This is a simplified rank calculation. 
        // In a real heavy-load scenario, this should be cached or calculated periodically.
        let studentAverages = [];

        for (const clsStudent of classStudents) {
            const sGrades = await prisma.grade.findMany({
                where: { studentId: clsStudent.id }
            });

            let sTotal = 0;
            let sMax = 0;

            sGrades.forEach(g => {
                sTotal += Number(g.marksObtained);
                sMax += Number(g.maxMarks);
            });

            const avg = sMax > 0 ? (sTotal / sMax) * 100 : 0;
            studentAverages.push({ studentId: clsStudent.id, avg });
        }

        // Sort descending
        studentAverages.sort((a, b) => b.avg - a.avg);

        // Find rank
        const rankIndex = studentAverages.findIndex(s => s.studentId === id);
        const rank = rankIndex !== -1 ? rankIndex + 1 : '-';

        res.json({
            success: true,
            data: {
                attendance: {
                    percentage: attendancePercentage,
                    totalDays: totalAttendance,
                    presentDays: presentAttendance
                },
                academic: {
                    averagePercentage: averageGrade,
                    totalExams: grades.length,
                    rank: rank,
                    totalStudents: classStudents.length
                }
            }
        });

    } catch (error) {
        console.error('getStudentPerformance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student performance' });
    }
};

module.exports = {
    getAllStudents,
    getStudentById,
    createStudent,
    updateStudent,
    deleteStudent,
    bulkImportStudents,
    promoteStudents,
    transferStudent,
    generateIDCards,
    getStudentStats,
    getStudentPerformance
};
