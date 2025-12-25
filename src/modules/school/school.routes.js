const express = require('express');
const router = express.Router();
const { validateTenant, getTenantDatabase } = require('../../middleware/tenant.middleware');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');

// Import all module routes
const dashboardRoutes = require('./dashboard.routes');
const studentsRoutes = require('./students.routes');
const teachersRoutes = require('./teachers.routes');
const classesRoutes = require('./classes.routes');
const attendanceRoutes = require('./attendance.routes');
const examsRoutes = require('./exams.routes');
const feesRoutes = require('./fees.routes');
const libraryRoutes = require('./library.routes');
const communicationRoutes = require('./communication.routes');
const subjectsRoutes = require('./subjects.routes');
const timetableRoutes = require('./timetable.routes');
const certificatesRoutes = require('./certificates.routes');
const transportRoutes = require('./transport.routes');
const reportsRoutes = require('./reports.routes');
const settingsRoutes = require('./settings.routes');
const usersRoutes = require('./users.routes');
const parentsRoutes = require('./parents.routes');
const assignmentsRoutes = require('./assignments.routes');
const admissionsRoutes = require('./admissions.routes');
const accountantRoutes = require('./accountant.routes');
const healthRoutes = require('./health.routes');
const hostelRoutes = require('./hostel.routes');
const inventoryRoutes = require('./inventory.routes');
const homeworkRoutes = require('./homework.routes');
const sportsRoutes = require('./sports.routes');

// CRITICAL: Middleware order matters!
// 1. First authenticate to set req.user from JWT
// 2. Then validate tenant to check req.user.tenantId
// 3. Then get tenant database connection
router.use(authenticateSchoolUser);  // Sets req.user from JWT
router.use(validateTenant);          // Checks req.user.tenantId
router.use(getTenantDatabase);       // Gets tenant DB connection

// Mount all routes
router.use('/dashboard', dashboardRoutes);
router.use('/students', studentsRoutes);
router.use('/teachers', teachersRoutes);
router.use('/classes', classesRoutes);
router.use('/attendance', attendanceRoutes);
router.use('/exams', examsRoutes);
router.use('/fees', feesRoutes);
router.use('/library', libraryRoutes);
router.use('/subjects', subjectsRoutes);
// Mount communication routes at root for /announcements, /events, /messages
router.use('/', communicationRoutes);
router.use('/communication', communicationRoutes); // Keep for legacy/grouping
router.use('/timetable', timetableRoutes);
router.use('/certificates', certificatesRoutes);
router.use('/transport', transportRoutes);
router.use('/reports', reportsRoutes);
router.use('/settings', settingsRoutes);
router.use('/users', usersRoutes);
router.use('/parents', parentsRoutes);
router.use('/assignments', assignmentsRoutes);
router.use('/admissions', admissionsRoutes);
router.use('/accountant', accountantRoutes);


// New Modules
router.use('/health', healthRoutes);
router.use('/hostel', hostelRoutes);
router.use('/inventory', inventoryRoutes);
router.use('/homework', homeworkRoutes);
router.use('/sports', sportsRoutes);
router.use('/disciplinary', require('./disciplinary.routes'));
router.use('/staff-attendance', require('./staff-attendance.routes'));
router.use('/support', require('./support.routes'));


module.exports = router;
