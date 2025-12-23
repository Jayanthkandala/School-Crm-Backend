const { getTenantPrismaClient } = require('../../utils/tenantDb');
const { hashPassword } = require('../../utils/encryption.util');

const getAllTeachers = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);

        const { page = 1, limit = 10, search, status } = req.query;
        const skip = (page - 1) * limit;

        const where = {
            OR: search ? [
                { employeeId: { contains: search, mode: 'insensitive' } },
                { user: { fullName: { contains: search, mode: 'insensitive' } } },
                { user: { email: { contains: search, mode: 'insensitive' } } }
            ] : undefined,
            status: status || undefined
        };

        const [teachers, total] = await Promise.all([
            prisma.teacher.findMany({
                where,
                include: {
                    user: { select: { fullName: true, email: true, phone: true } }
                },
                skip: parseInt(skip),
                take: parseInt(limit),
                orderBy: { joiningDate: 'desc' }
            }),
            prisma.teacher.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                teachers: teachers.map(t => ({
                    ...t,
                    status: t.status
                })),
                pagination: {
                    total,
                    page: parseInt(page),
                    pages: Math.ceil(total / limit)
                }
            }
        });
    } catch (error) {
        console.error('getAllTeachers error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch teachers' });
    }
};

const getTeacherById = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const prisma = getTenantPrismaClient(tenantId);

        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: {
                user: true,
                classTeacher: true // Relation name is classTeacher (for one class)
            }
        });

        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        res.json({
            success: true,
            data: {
                teacher: {
                    ...teacher,
                    status: teacher.status
                }
            }
        });
    } catch (error) {
        console.error('getTeacherById error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch teacher' });
    }
};

const createTeacher = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);
        const {
            fullName, email, password, phone, gender, dob, address,
            employeeId, joiningDate, qualification, specialization, experienceYears, salary,
            // Personal details
            aadharNumber, panNumber, maritalStatus, spouseName, numberOfChildren,
            // Emergency
            emergencyContact, emergencyPhone,
            // Bank details
            bankName, bankAccount, ifscCode
        } = req.body;

        if (!email || !fullName || !employeeId) {
            return res.status(400).json({ success: false, message: 'Missing required fields' });
        }

        // Validate experience
        if (experienceYears && parseInt(experienceYears) < 0) {
            return res.status(400).json({ success: false, message: 'Experience cannot be negative' });
        }

        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) return res.status(400).json({ success: false, message: 'Email already exists' });

        // Check employeeId uniqueness
        const existingEmployee = await prisma.teacher.findUnique({ where: { employeeId } });
        if (existingEmployee) return res.status(400).json({ success: false, message: 'Employee ID already exists' });

        const passwordHash = await hashPassword(password || 'Teacher@123');

        // Transaction
        const teacher = await prisma.$transaction(async (tx) => {
            const user = await tx.user.create({
                data: {
                    fullName,
                    email,
                    phone,
                    gender: gender || null,
                    dateOfBirth: dob ? new Date(dob) : null,
                    passwordHash,
                    role: 'TEACHER',
                }
            });

            return await tx.teacher.create({
                data: {
                    userId: user.id,
                    employeeId,
                    joiningDate: new Date(joiningDate || new Date()),
                    qualification,
                    specialization,
                    experience: experienceYears ? parseInt(experienceYears) : 0,
                    salary: salary ? parseFloat(salary) : null,
                    // Personal details
                    aadharNumber,
                    panNumber,
                    maritalStatus,
                    spouseName,
                    numberOfChildren: numberOfChildren ? parseInt(numberOfChildren) : 0,
                    // Emergency
                    emergencyContact,
                    emergencyPhone,
                    // Bank details
                    bankName,
                    bankAccount,
                    ifscCode
                }
            });
        });

        res.status(201).json({ success: true, message: 'Teacher created successfully', data: { teacher } });
    } catch (error) {
        console.error('createTeacher error:', error);
        res.status(500).json({ success: false, message: 'Failed to create teacher' });
    }
};

const updateTeacher = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const prisma = getTenantPrismaClient(tenantId);
        const {
            fullName, phone, gender, dob, address,
            qualification, specialization, experienceYears, salary, status, employeeId,
            // Personal details
            aadharNumber, panNumber, maritalStatus, spouseName, numberOfChildren,
            // Emergency
            emergencyContact, emergencyPhone,
            // Bank details
            bankName, bankAccount, ifscCode
        } = req.body;

        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        // Validate experience
        if (experienceYears && parseInt(experienceYears) < 0) {
            return res.status(400).json({ success: false, message: 'Experience cannot be negative' });
        }

        // Check employeeId uniqueness if being updated
        if (employeeId && employeeId !== teacher.employeeId) {
            const existingEmployee = await prisma.teacher.findUnique({ where: { employeeId } });
            if (existingEmployee) {
                return res.status(400).json({ success: false, message: 'Employee ID already exists' });
            }
        }

        const updated = await prisma.$transaction(async (tx) => {
            await tx.user.update({
                where: { id: teacher.userId },
                data: {
                    ...(fullName && { fullName }),
                    ...(phone !== undefined && { phone }),
                    ...(gender !== undefined && { gender }),
                    ...(dob && { dateOfBirth: new Date(dob) })
                }
            });

            return await tx.teacher.update({
                where: { id },
                data: {
                    ...(employeeId && { employeeId }),
                    ...(qualification !== undefined && { qualification }),
                    ...(specialization !== undefined && { specialization }),
                    ...(experienceYears !== undefined && { experience: parseInt(experienceYears) }),
                    ...(salary !== undefined && { salary: parseFloat(salary) }),
                    ...(status && { status }),
                    // Personal details
                    ...(aadharNumber !== undefined && { aadharNumber }),
                    ...(panNumber !== undefined && { panNumber }),
                    ...(maritalStatus !== undefined && { maritalStatus }),
                    ...(spouseName !== undefined && { spouseName }),
                    ...(numberOfChildren !== undefined && { numberOfChildren: parseInt(numberOfChildren) }),
                    // Emergency
                    ...(emergencyContact !== undefined && { emergencyContact }),
                    ...(emergencyPhone !== undefined && { emergencyPhone }),
                    // Bank details
                    ...(bankName !== undefined && { bankName }),
                    ...(bankAccount !== undefined && { bankAccount }),
                    ...(ifscCode !== undefined && { ifscCode })
                }
            });
        });

        res.json({ success: true, message: 'Teacher updated', data: { teacher: updated } });
    } catch (error) {
        console.error('updateTeacher error:', error);
        res.status(500).json({ success: false, message: 'Failed to update teacher' });
    }
};

const deleteTeacher = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const prisma = getTenantPrismaClient(tenantId);

        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher not found' });

        await prisma.user.delete({ where: { id: teacher.userId } });

        res.json({ success: true, message: 'Teacher deleted successfully' });
    } catch (error) {
        console.error('deleteTeacher error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete teacher' });
    }
};

// Assign Teacher to Class
const assignToClass = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const prisma = getTenantPrismaClient(tenantId);
        const { classId, subjectId, isClassTeacher } = req.body;

        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        // Verify class exists
        const classExists = await prisma.class.findUnique({ where: { id: classId } });
        if (!classExists) {
            return res.status(404).json({ success: false, message: 'Class not found' });
        }

        // If assigning as class teacher
        if (isClassTeacher) {
            await prisma.class.update({
                where: { id: classId },
                data: { classTeacherId: id }
            });
        }

        // If assigning to teach a subject
        if (subjectId) {
            const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
            if (!subject) {
                return res.status(404).json({ success: false, message: 'Subject not found' });
            }

            // Update subject to assign teacher
            await prisma.subject.update({
                where: { id: subjectId },
                data: { teacherId: id }
            });
        }

        res.json({
            success: true,
            message: 'Teacher assigned to class successfully',
            data: {
                teacherId: id,
                classId,
                subjectId,
                isClassTeacher
            }
        });
    } catch (error) {
        console.error('assignToClass error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign teacher' });
    }
};

// Remove Teacher from Class
const removeFromClass = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const prisma = getTenantPrismaClient(tenantId);
        const { classId, subjectId } = req.body;

        const teacher = await prisma.teacher.findUnique({ where: { id } });
        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        // Remove as class teacher
        if (classId) {
            const classData = await prisma.class.findUnique({ where: { id: classId } });
            if (classData && classData.classTeacherId === id) {
                await prisma.class.update({
                    where: { id: classId },
                    data: { classTeacherId: null }
                });
            }
        }

        // Remove from subject
        if (subjectId) {
            const subject = await prisma.subject.findUnique({ where: { id: subjectId } });
            if (subject && subject.teacherId === id) {
                await prisma.subject.update({
                    where: { id: subjectId },
                    data: { teacherId: null }
                });
            }
        }

        res.json({
            success: true,
            message: 'Teacher removed from class successfully'
        });
    } catch (error) {
        console.error('removeFromClass error:', error);
        res.status(500).json({ success: false, message: 'Failed to remove teacher' });
    }
};

// Get Teacher Timetable
const getTeacherTimetable = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { id } = req.params;
        const prisma = getTenantPrismaClient(tenantId);

        const teacher = await prisma.teacher.findUnique({
            where: { id },
            include: {
                user: { select: { fullName: true } },
                classTeacher: { // One-to-one relation
                    include: {
                        subjects: {
                            where: { teacherId: id },
                            include: { class: true }
                        }
                    }
                }
            }
        });

        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher not found' });
        }

        // Get timetable entries for this teacher
        const timetableEntries = await prisma.timetableEntry.findMany({
            where: { teacherId: id },
            include: {
                class: true,
                subject: true
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });

        // Group by day of week
        const timetable = {
            teacherName: teacher.user.fullName,
            employeeId: teacher.employeeId,
            schedule: {}
        };

        const daysMap = {
            1: 'MONDAY',
            2: 'TUESDAY',
            3: 'WEDNESDAY',
            4: 'THURSDAY',
            5: 'FRIDAY',
            6: 'SATURDAY',
            7: 'SUNDAY'
        };

        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
        days.forEach(day => {
            timetable.schedule[day] = timetableEntries
                .filter(entry => daysMap[entry.dayOfWeek] === day) // FIX: Compare mapped string to day string
                .map(entry => ({
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    subject: entry.subject.subjectName,
                    class: `${entry.class.className} - ${entry.class.section}`,
                    room: entry.room
                }));
        });

        res.json({ success: true, data: { timetable } });
    } catch (error) {
        console.error('getTeacherTimetable error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch timetable' });
    }
};

// Bulk Import Teachers
const bulkImportTeachers = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);
        const { teachers } = req.body;

        if (!Array.isArray(teachers) || teachers.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid teachers data' });
        }

        let imported = 0;
        const errors = [];

        for (const teacherData of teachers) {
            try {
                const { fullName, email, employeeId, qualification, specialization, experienceYears } = teacherData;

                // Check if email already exists
                const existing = await prisma.user.findUnique({ where: { email } });
                if (existing) {
                    errors.push({ employeeId, email, error: 'Email already exists' });
                    continue;
                }

                const passwordHash = await hashPassword(teacherData.password || 'Teacher@123');

                await prisma.$transaction(async (tx) => {
                    const user = await tx.user.create({
                        data: {
                            fullName,
                            email,
                            passwordHash,
                            role: 'TEACHER',
                            phone: teacherData.phone
                        }
                    });

                    await tx.teacher.create({
                        data: {
                            userId: user.id,
                            employeeId,
                            joiningDate: new Date(),
                            qualification,
                            specialization,
                            experience: experienceYears ? parseInt(experienceYears) : 0
                        }
                    });
                });

                imported++;
            } catch (error) {
                errors.push({
                    employeeId: teacherData.employeeId,
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
        console.error('bulkImportTeachers error:', error);
        res.status(500).json({ success: false, message: 'Failed to bulk import teachers' });
    }
};

// Get Teacher Statistics
const getTeacherStats = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);

        const [total, active, onLeave, resigned] = await Promise.all([
            prisma.teacher.count(),
            prisma.teacher.count({ where: { status: 'ACTIVE' } }),
            prisma.teacher.count({ where: { status: 'ON_LEAVE' } }),
            prisma.teacher.count({ where: { status: 'RESIGNED' } })
        ]);

        // Gender distribution
        const [male, female, other] = await Promise.all([
            prisma.teacher.count({
                where: { user: { gender: 'MALE' } }
            }),
            prisma.teacher.count({
                where: { user: { gender: 'FEMALE' } }
            }),
            prisma.teacher.count({
                where: { user: { gender: 'OTHER' } }
            })
        ]);

        // Experience distribution
        const teachers = await prisma.teacher.findMany({
            where: { status: 'ACTIVE' },
            select: { experienceYears: true, qualification: true }
        });

        const experienceDistribution = {
            '0-2': 0,
            '3-5': 0,
            '6-10': 0,
            '10+': 0
        };

        const qualificationDistribution = {};

        teachers.forEach(teacher => {
            const exp = teacher.experienceYears || 0;
            if (exp <= 2) experienceDistribution['0-2']++;
            else if (exp <= 5) experienceDistribution['3-5']++;
            else if (exp <= 10) experienceDistribution['6-10']++;
            else experienceDistribution['10+']++;

            if (teacher.qualification) {
                qualificationDistribution[teacher.qualification] =
                    (qualificationDistribution[teacher.qualification] || 0) + 1;
            }
        });

        res.json({
            success: true,
            data: {
                total,
                byStatus: {
                    active,
                    onLeave,
                    resigned
                },
                byGender: {
                    male,
                    female,
                    other
                },
                experienceDistribution,
                qualificationDistribution
            }
        });
    } catch (error) {
        console.error('getTeacherStats error:', error);
        // Return empty stats if tenant database is not set up yet
        res.json({
            success: true,
            data: {
                total: 0,
                byStatus: {
                    active: 0,
                    onLeave: 0,
                    resigned: 0
                },
                byGender: {
                    male: 0,
                    female: 0,
                    other: 0
                },
                experienceDistribution: {
                    '0-2': 0,
                    '3-5': 0,
                    '6-10': 0,
                    '10+': 0
                },
                qualificationDistribution: {}
            }
        });
    }
};

// Teacher Portal Actions

const getMyClasses = async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);

        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                classTeacher: {
                    include: {
                        subjects: { where: { teacherId: { not: null } } } // Just to get counts? No need.
                    }
                },
                subjectAssignments: {
                    include: {
                        class: true,
                        subject: true
                    }
                }
            }
        });

        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

        const classesMap = new Map();

        // 1. Add Class Teacher Class
        if (teacher.classTeacher) {
            classesMap.set(teacher.classTeacher.id, {
                id: teacher.classTeacher.id,
                className: teacher.classTeacher.className,
                section: teacher.classTeacher.section,
                role: 'CLASS_TEACHER',
                subjects: [] // Will be populated if they teach subjects too
            });
        }

        // 2. Add Subject Assignments
        teacher.subjectAssignments.forEach(sa => {
            if (classesMap.has(sa.classId)) {
                // Already exists (as Class Teacher or previous subject)
                const cls = classesMap.get(sa.classId);
                // If previously Class Teacher, keep role. Else Subject Teacher.
                // But wait, if I am Class Teacher AND Subject Teacher?
                // Role should be "Class Teacher" generally implies higher privs.
                // But subjects list grows.
                cls.subjects.push({
                    id: sa.subject.id,
                    name: sa.subject.subjectName,
                    code: sa.subject.subjectCode
                });
            } else {
                // New entry
                classesMap.set(sa.classId, {
                    id: sa.class.id,
                    className: sa.class.className,
                    section: sa.class.section,
                    role: 'SUBJECT_TEACHER',
                    subjects: [{
                        id: sa.subject.id,
                        name: sa.subject.subjectName,
                        code: sa.subject.subjectCode
                    }]
                });
            }
        });

        res.json({ success: true, data: { classes: Array.from(classesMap.values()) } });
    } catch (error) {
        console.error('getMyClasses error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch classes' });
    }
};

const getMyStudents = async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);

        const teacher = await prisma.teacher.findUnique({
            where: { userId },
            include: {
                classTeacher: { select: { id: true } },
                subjectAssignments: { select: { classId: true } }
            }
        });

        if (!teacher) return res.status(404).json({ success: false, message: 'Teacher profile not found' });

        const classIds = new Set();
        if (teacher.classTeacher) classIds.add(teacher.classTeacher.id);
        teacher.subjectAssignments.forEach(sa => classIds.add(sa.classId));

        if (classIds.size === 0) {
            return res.json({ success: true, data: { students: [] } });
        }

        const students = await prisma.student.findMany({
            where: {
                classId: { in: Array.from(classIds) },
                status: 'ACTIVE'
            },
            include: {
                user: { select: { fullName: true, email: true, phone: true, profilePhoto: true } },
                class: { select: { id: true, className: true, section: true } },
                parents: {
                    where: { isPrimary: true },
                    include: { parent: { include: { user: { select: { fullName: true, phone: true } } } } }
                }
            },
            orderBy: [
                { class: { className: 'asc' } },
                { user: { fullName: 'asc' } }
            ]
        });

        // Flatten parent info
        const formattedStudents = students.map(s => {
            const primaryParent = s.parents[0]?.parent;
            return {
                id: s.id,
                classId: s.class.id,
                name: s.user.fullName,
                admissionNumber: s.admissionNumber,
                rollNumber: s.rollNumber,
                className: s.class.className,
                section: s.class.section || '',
                photo: s.user.profilePhoto, // Assuming helper handles full URL
                parentName: primaryParent?.user?.fullName || '-',
                parentPhone: primaryParent?.user?.phone || '-'
            };
        });

        res.json({ success: true, data: { students: formattedStudents } });
    } catch (error) {
        console.error('getMyStudents error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch students' });
    }
};

const getMyTimetable = async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const prisma = getTenantPrismaClient(tenantId);

        const teacher = await prisma.teacher.findUnique({
            where: { userId }
        });

        if (!teacher) {
            return res.status(404).json({ success: false, message: 'Teacher profile not found' });
        }

        // Reuse existing logic logic by copying core parts or delegating?
        // Copying core logic to avoid req params dependency
        const id = teacher.id;

        const timetableEntries = await prisma.timetableEntry.findMany({
            where: { teacherId: id },
            include: {
                class: true,
                subject: true
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });

        const daysMap = {
            1: 'MONDAY', 2: 'TUESDAY', 3: 'WEDNESDAY', 4: 'THURSDAY', 5: 'FRIDAY', 6: 'SATURDAY', 7: 'SUNDAY'
        };
        const days = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

        const schedule = {};
        days.forEach(day => {
            schedule[day] = timetableEntries
                .filter(entry => daysMap[entry.dayOfWeek] === day)
                .map(entry => ({
                    id: entry.id,
                    startTime: entry.startTime,
                    endTime: entry.endTime,
                    subject: entry.subject.subjectName,
                    class: `${entry.class.className} - ${entry.class.section}`,
                    room: entry.room || 'N/A'
                }));
        });

        res.json({ success: true, data: { timetable: { teacherName: req.user.fullName, schedule } } });
    } catch (error) {
        console.error('getMyTimetable error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch timetable' });
    }
};

module.exports = {
    getAllTeachers,
    getTeacherById,
    createTeacher,
    updateTeacher,
    deleteTeacher,
    assignToClass,
    removeFromClass,
    getTeacherTimetable,
    bulkImportTeachers,
    getTeacherStats,
    getMyClasses,
    getMyStudents,
    getMyTimetable
};
