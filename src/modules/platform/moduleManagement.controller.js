const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get school's enabled/disabled modules
 */
const getSchoolModules = async (req, res) => {
    try {
        const { schoolId } = req.params;

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: {
                id: true,
                schoolName: true,
                enabledModules: true,
            },
        });

        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        // Default modules if not set
        const defaultModules = {
            students: true,
            teachers: true,
            classes: true,
            attendance: true,
            fees: true,
            exams: true,
            assignments: true,
            admissions: true,
            parents: true,
            library: false,
            transport: false,
            certificates: false,
            communication: true,
            timetable: true,
            reports: true,
            dashboard: true,
            accountant: true,
            settings: true,
        };

        const enabledModules = school.enabledModules || defaultModules;

        res.json({
            success: true,
            data: {
                school: {
                    id: school.id,
                    name: school.schoolName,
                },
                modules: enabledModules,
            },
        });
    } catch (error) {
        console.error('Get school modules error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch modules' });
    }
};

/**
 * Update school's modules (enable/disable)
 */
const updateSchoolModules = async (req, res) => {
    try {
        const { schoolId } = req.params;
        const { modules } = req.body;

        // Validate modules
        const validModules = [
            'students', 'teachers', 'classes', 'attendance', 'fees', 'exams',
            'assignments', 'admissions', 'parents', 'library', 'transport',
            'certificates', 'communication', 'timetable', 'reports', 'dashboard',
            'accountant', 'settings',
        ];

        const invalidModules = Object.keys(modules).filter(m => !validModules.includes(m));
        if (invalidModules.length > 0) {
            return res.status(400).json({
                success: false,
                message: 'Invalid modules',
                invalidModules,
            });
        }

        await prisma.school.update({
            where: { id: schoolId },
            data: {
                enabledModules: modules,
            },
        });

        // Log action
        await prisma.auditLog.create({
            data: {
                userId: req.user.id,
                action: 'UPDATE_MODULES',
                resource: 'SCHOOL',
                resourceId: schoolId,
                details: JSON.stringify({ modules }),
            },
        });

        res.json({
            success: true,
            message: 'School modules updated successfully',
            data: { modules },
        });
    } catch (error) {
        console.error('Update school modules error:', error);
        res.status(500).json({ success: false, message: 'Failed to update modules' });
    }
};

/**
 * Enable specific module for a school
 */
const enableModule = async (req, res) => {
    try {
        const { schoolId, moduleName } = req.params;

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { enabledModules: true },
        });

        const modules = school.enabledModules || {};
        modules[moduleName] = true;

        await prisma.school.update({
            where: { id: schoolId },
            data: { enabledModules: modules },
        });

        res.json({
            success: true,
            message: `Module '${moduleName}' enabled successfully`,
        });
    } catch (error) {
        console.error('Enable module error:', error);
        res.status(500).json({ success: false, message: 'Failed to enable module' });
    }
};

/**
 * Disable specific module for a school
 */
const disableModule = async (req, res) => {
    try {
        const { schoolId, moduleName } = req.params;

        // Core modules that cannot be disabled
        const coreModules = ['students', 'teachers', 'classes', 'dashboard', 'settings'];
        if (coreModules.includes(moduleName)) {
            return res.status(400).json({
                success: false,
                message: `Cannot disable core module '${moduleName}'`,
            });
        }

        const school = await prisma.school.findUnique({
            where: { id: schoolId },
            select: { enabledModules: true },
        });

        const modules = school.enabledModules || {};
        modules[moduleName] = false;

        await prisma.school.update({
            where: { id: schoolId },
            data: { enabledModules: modules },
        });

        res.json({
            success: true,
            message: `Module '${moduleName}' disabled successfully`,
        });
    } catch (error) {
        console.error('Disable module error:', error);
        res.status(500).json({ success: false, message: 'Failed to disable module' });
    }
};

/**
 * Get all available modules
 */
const getAllModules = async (req, res) => {
    try {
        const modules = [
            {
                name: 'students',
                displayName: 'Student Management',
                description: 'Manage student admissions, profiles, and records',
                category: 'Core',
                canDisable: false,
            },
            {
                name: 'teachers',
                displayName: 'Teacher Management',
                description: 'Manage teacher profiles, assignments, and schedules',
                category: 'Core',
                canDisable: false,
            },
            {
                name: 'classes',
                displayName: 'Class Management',
                description: 'Manage classes, sections, and subjects',
                category: 'Core',
                canDisable: false,
            },
            {
                name: 'attendance',
                displayName: 'Attendance',
                description: 'Track student and teacher attendance',
                category: 'Academic',
                canDisable: true,
            },
            {
                name: 'fees',
                displayName: 'Fee Management',
                description: 'Manage fee structure, invoices, and payments',
                category: 'Financial',
                canDisable: true,
            },
            {
                name: 'exams',
                displayName: 'Exams & Grades',
                description: 'Manage exams, grades, and report cards',
                category: 'Academic',
                canDisable: true,
            },
            {
                name: 'assignments',
                displayName: 'Assignments',
                description: 'Create and manage assignments',
                category: 'Academic',
                canDisable: true,
            },
            {
                name: 'admissions',
                displayName: 'Admissions',
                description: 'Handle admission applications',
                category: 'Core',
                canDisable: true,
            },
            {
                name: 'parents',
                displayName: 'Parent Portal',
                description: 'Parent access and communication',
                category: 'Communication',
                canDisable: true,
            },
            {
                name: 'library',
                displayName: 'Library Management',
                description: 'Manage library books and transactions',
                category: 'Additional',
                canDisable: true,
            },
            {
                name: 'transport',
                displayName: 'Transport Management',
                description: 'Manage school buses and routes',
                category: 'Additional',
                canDisable: true,
            },
            {
                name: 'certificates',
                displayName: 'Certificates',
                description: 'Generate and manage certificates',
                category: 'Additional',
                canDisable: true,
            },
            {
                name: 'communication',
                displayName: 'Communication',
                description: 'Messages and announcements',
                category: 'Communication',
                canDisable: true,
            },
            {
                name: 'timetable',
                displayName: 'Timetable',
                description: 'Manage class schedules',
                category: 'Academic',
                canDisable: true,
            },
            {
                name: 'reports',
                displayName: 'Reports',
                description: 'Generate various reports',
                category: 'Analytics',
                canDisable: true,
            },
            {
                name: 'dashboard',
                displayName: 'Dashboard',
                description: 'School overview and statistics',
                category: 'Core',
                canDisable: false,
            },
            {
                name: 'accountant',
                displayName: 'Accountant Module',
                description: 'Financial management and accounting',
                category: 'Financial',
                canDisable: true,
            },
            {
                name: 'settings',
                displayName: 'Settings',
                description: 'School configuration and settings',
                category: 'Core',
                canDisable: false,
            },
        ];

        res.json({
            success: true,
            data: { modules },
        });
    } catch (error) {
        console.error('Get all modules error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch modules' });
    }
};

/**
 * Bulk update modules for multiple schools
 */
const bulkUpdateModules = async (req, res) => {
    try {
        const { schoolIds, modules } = req.body;

        let updated = 0;
        const errors = [];

        for (const schoolId of schoolIds) {
            try {
                await prisma.school.update({
                    where: { id: schoolId },
                    data: { enabledModules: modules },
                });
                updated++;
            } catch (error) {
                errors.push({ schoolId, error: error.message });
            }
        }

        res.json({
            success: true,
            message: 'Bulk update completed',
            data: {
                updated,
                failed: errors.length,
                errors,
            },
        });
    } catch (error) {
        console.error('Bulk update modules error:', error);
        res.status(500).json({ success: false, message: 'Failed to bulk update modules' });
    }
};

/**
 * Get module usage statistics
 */
const getModuleStats = async (req, res) => {
    try {
        const schools = await prisma.school.findMany({
            where: { status: 'ACTIVE' },
            select: { enabledModules: true },
        });

        const stats = {};
        const moduleNames = [
            'students', 'teachers', 'classes', 'attendance', 'fees', 'exams',
            'assignments', 'admissions', 'parents', 'library', 'transport',
            'certificates', 'communication', 'timetable', 'reports', 'dashboard',
            'accountant', 'settings',
        ];

        moduleNames.forEach(moduleName => {
            stats[moduleName] = {
                enabled: 0,
                disabled: 0,
                percentage: 0,
            };
        });

        schools.forEach(school => {
            const modules = school.enabledModules || {};
            moduleNames.forEach(moduleName => {
                if (modules[moduleName] !== false) {
                    stats[moduleName].enabled++;
                } else {
                    stats[moduleName].disabled++;
                }
            });
        });

        const totalSchools = schools.length;
        Object.keys(stats).forEach(moduleName => {
            stats[moduleName].percentage = totalSchools > 0
                ? Math.round((stats[moduleName].enabled / totalSchools) * 100)
                : 0;
        });

        res.json({
            success: true,
            data: {
                totalSchools,
                stats,
            },
        });
    } catch (error) {
        console.error('Get module stats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch module stats' });
    }
};

module.exports = {
    getSchoolModules,
    updateSchoolModules,
    enableModule,
    disableModule,
    getAllModules,
    bulkUpdateModules,
    getModuleStats,
};
