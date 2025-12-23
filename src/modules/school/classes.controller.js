const { getTenantPrismaClient } = require('../../utils/tenantDb');

// Classes Management
const getAllClasses = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const classes = await tenantDb.class.findMany({
            include: {
                _count: {
                    select: {
                        students: true,
                        subjects: true,
                    },
                },
            },
            orderBy: { className: 'asc' },
        });

        res.json({ success: true, data: { classes } });
    } catch (error) {
        console.error('getAllClasses error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch classes' });
    }
};

const createClass = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { className, section, capacity, academicYear, maxStudents, roomNumber, floor, building } = req.body;

        const currentAcademicYear = academicYear || new Date().getFullYear().toString();

        // Check if class already exists (className + section + academicYear must be unique)
        const existing = await tenantDb.class.findFirst({
            where: {
                className,
                section: section || null,
                academicYear: currentAcademicYear
            },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Class ${className}${section ? ' - ' + section : ''} already exists for academic year ${currentAcademicYear}`
            });
        }

        const newClass = await tenantDb.class.create({
            data: {
                className,
                section,
                maxStudents: maxStudents || capacity || 40,
                academicYear: currentAcademicYear,
                roomNumber,
                floor,
                building,
                currentStrength: 0,
            },
        });

        res.status(201).json({ success: true, data: { class: newClass } });
    } catch (error) {
        console.error('createClass error:', error);
        res.status(500).json({ success: false, message: 'Failed to create class' });
    }
};

const updateClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { className, section, capacity, academicYear, maxStudents, roomNumber, floor, building } = req.body;

        const updatedClass = await tenantDb.class.update({
            where: { id },
            data: {
                ...(className && { className }),
                ...(section !== undefined && { section }),
                ...(maxStudents && { maxStudents }),
                ...(capacity && { maxStudents: capacity }),
                ...(academicYear && { academicYear }),
                ...(roomNumber !== undefined && { roomNumber }),
                ...(floor !== undefined && { floor }),
                ...(building !== undefined && { building }),
            },
        });

        res.json({ success: true, data: { class: updatedClass } });
    } catch (error) {
        console.error('updateClass error:', error);
        res.status(500).json({ success: false, message: 'Failed to update class' });
    }
};

const deleteClass = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Check if class has students
        const studentsCount = await tenantDb.student.count({
            where: { classId: id },
        });

        if (studentsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete class with ${studentsCount} students. Please transfer students first.`
            });
        }

        await tenantDb.class.delete({ where: { id } });

        res.json({ success: true, message: 'Class deleted successfully' });
    } catch (error) {
        console.error('deleteClass error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete class' });
    }
};

const getClassSubjects = async (req, res) => {
    try {
        const { classId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const classSubjects = await tenantDb.classSubject.findMany({
            where: { classId },
            include: {
                subject: true,
                teachers: {
                    include: {
                        teacher: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true,
                                        email: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        res.json({ success: true, data: { subjects: classSubjects } });
    } catch (error) {
        console.error('getClassSubjects error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch class subjects' });
    }
};

// Subjects Management
const getAllSubjects = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const subjects = await tenantDb.subject.findMany({
            include: {
                _count: {
                    select: {
                        classes: true,
                        teachers: true,
                    },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.json({ success: true, data: { subjects } });
    } catch (error) {
        console.error('getAllSubjects error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch subjects' });
    }
};

const createSubject = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { name, code, description, type } = req.body;

        // Check if subject code already exists
        const existing = await tenantDb.subject.findFirst({
            where: { subjectCode: code },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Subject with this code already exists'
            });
        }

        const subject = await tenantDb.subject.create({
            data: {
                subjectName: name,
                subjectCode: code,
                description,
            },
        });

        res.status(201).json({ success: true, data: { subject } });
    } catch (error) {
        console.error('createSubject error:', error);
        res.status(500).json({ success: false, message: 'Failed to create subject' });
    }
};

const updateSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { name, code, description, type } = req.body;

        const subject = await tenantDb.subject.update({
            where: { id },
            data: {
                ...(name && { subjectName: name }),
                ...(code && { subjectCode: code }),
                ...(description && { description }),
            },
        });

        res.json({ success: true, data: { subject } });
    } catch (error) {
        console.error('updateSubject error:', error);
        res.status(500).json({ success: false, message: 'Failed to update subject' });
    }
};

const deleteSubject = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Check if subject is assigned to any class
        const assignmentsCount = await tenantDb.classSubject.count({
            where: { subjectId: id },
        });

        if (assignmentsCount > 0) {
            return res.status(400).json({
                success: false,
                message: `Cannot delete subject assigned to ${assignmentsCount} classes. Please remove assignments first.`
            });
        }

        await tenantDb.subject.delete({ where: { id } });

        res.json({ success: true, message: 'Subject deleted successfully' });
    } catch (error) {
        console.error('deleteSubject error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete subject' });
    }
};

const assignSubjectToClass = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, subjectId } = req.body;

        // Check if already assigned
        const existing = await tenantDb.classSubject.findFirst({
            where: { classId, subjectId },
        });

        if (existing) {
            return res.status(400).json({
                success: false,
                message: 'Subject already assigned to this class'
            });
        }

        const assignment = await tenantDb.classSubject.create({
            data: {
                classId,
                subjectId,
            },
            include: {
                subject: true,
                class: true,
            },
        });

        res.status(201).json({ success: true, data: { assignment } });
    } catch (error) {
        console.error('assignSubjectToClass error:', error);
        res.status(500).json({ success: false, message: 'Failed to assign subject' });
    }
};

const getClassStats = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { academicYear } = req.query;

        const where = academicYear ? { academicYear } : {};

        const [total, classes] = await Promise.all([
            tenantDb.class.count({ where }),
            tenantDb.class.findMany({
                where,
                include: {
                    _count: {
                        select: {
                            students: true,
                            subjects: true,
                        }
                    }
                }
            })
        ]);

        // Calculate statistics
        const totalStudents = classes.reduce((sum, cls) => sum + cls._count.students, 0);
        const totalSubjects = classes.reduce((sum, cls) => sum + cls._count.subjects, 0);
        const avgStudentsPerClass = total > 0 ? (totalStudents / total).toFixed(2) : 0;
        const avgSubjectsPerClass = total > 0 ? (totalSubjects / total).toFixed(2) : 0;

        // Group by academic year
        const byAcademicYear = await tenantDb.class.groupBy({
            by: ['academicYear'],
            _count: true,
        });

        res.json({
            success: true,
            data: {
                total,
                totalStudents,
                totalSubjects,
                avgStudentsPerClass: parseFloat(avgStudentsPerClass),
                avgSubjectsPerClass: parseFloat(avgSubjectsPerClass),
                byAcademicYear: byAcademicYear.reduce((acc, item) => {
                    acc[item.academicYear] = item._count;
                    return acc;
                }, {}),
            }
        });
    } catch (error) {
        console.error('getClassStats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch class statistics' });
    }
};

module.exports = {
    getAllClasses,
    createClass,
    updateClass,
    deleteClass,
    getClassSubjects,
    getAllSubjects,
    createSubject,
    updateSubject,
    deleteSubject,
    assignSubjectToClass,
    getClassStats,
};
