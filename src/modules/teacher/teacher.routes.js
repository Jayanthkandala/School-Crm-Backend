const express = require('express');
const router = express.Router();
const teacherController = require('./teacher.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');

router.use(authenticateSchoolUser);

// Middleware to verify user is a teacher
const requireTeacher = (req, res, next) => {
    if (!['TEACHER', 'PRINCIPAL'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Teacher access required.',
        });
    }
    next();
};

router.use(requireTeacher);

/**
 * @swagger
 * /teacher/dashboard:
 *   get:
 *     summary: Get teacher dashboard
 *     tags: [Teacher Portal]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Teacher dashboard data
 */
router.get('/dashboard', teacherController.getDashboard);

router.get('/my-classes', teacherController.getMyClasses);
router.get('/my-students', teacherController.getMyStudents);
router.get('/my-timetable', teacherController.getMyTimetable);
router.get('/students/:studentId/progress', teacherController.getStudentProgress);
router.post('/students/:studentId/remarks', teacherController.addStudentRemark);
router.post('/students/:studentId/behavioral-notes', teacherController.addBehavioralNote);

// Leave Management
router.post('/leave/apply', teacherController.applyLeave);
router.get('/leave/balance', teacherController.getLeaveBalance);
router.get('/leave/history', teacherController.getLeaveHistory);

// Parent Communication
router.post('/messages/send', teacherController.sendMessageToParent);
router.post('/meetings/schedule', teacherController.scheduleParentMeeting);
router.get('/messages', teacherController.getMyMessages);

// Reports
router.get('/classes/:classId/performance', teacherController.getClassPerformance);

// Profile
router.get('/profile', teacherController.getMyProfile);
router.put('/profile', teacherController.updateMyProfile);
router.post('/change-password', teacherController.changePassword);

// Resources
router.get('/resources', teacherController.getMyResources);
router.post('/resources', teacherController.uploadResource);
router.delete('/resources/:id', teacherController.deleteResource);

module.exports = router;
