const { getTenantPrismaClient } = require('../../utils/tenantDb');

const getDashboard = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({
            where: { userId },
            include: {
                subjectAssignments: {
                    include: { subject: true },
                },
            },
        });

        res.json({ success: true, data: { teacher } });
    } catch (error) {
        console.error('Teacher dashboard error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch dashboard' });
    }
};

const getMyClasses = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        const classes = await tenantDb.subjectTeacher.findMany({
            where: { teacherId: teacher.id },
            include: {
                subject: {
                    include: {
                        classes: {
                            include: { class: true },
                        },
                    },
                },
            },
        });

        res.json({ success: true, data: { classes } });
    } catch (error) {
        console.error('Get classes error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch classes' });
    }
};

const applyLeave = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { leaveType, fromDate, toDate, reason } = req.body;

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        const leave = await tenantDb.leaveApplication.create({
            data: {
                teacherId: teacher.id,
                leaveType,
                fromDate: new Date(fromDate),
                toDate: new Date(toDate),
                reason,
                status: 'PENDING',
            },
        });

        res.status(201).json({ success: true, data: { leave } });
    } catch (error) {
        console.error('Apply leave error:', error);
        res.status(500).json({ success: false, message: 'Failed to apply leave' });
    }
};

const getLeaveBalance = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        res.json({
            success: true,
            data: {
                casualLeave: teacher.casualLeave,
                sickLeave: teacher.sickLeave,
                earnedLeave: teacher.earnedLeave,
            },
        });
    } catch (error) {
        console.error('Get leave balance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leave balance' });
    }
};

// Get My Students
const getMyStudents = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        // Get all students from classes where teacher teaches
        const subjectAssignments = await tenantDb.subjectTeacher.findMany({
            where: { teacherId: teacher.id },
            include: {
                subject: {
                    include: {
                        classes: {
                            include: {
                                class: {
                                    include: {
                                        students: {
                                            include: {
                                                user: true
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        });

        // Flatten and deduplicate students
        const studentsMap = new Map();
        subjectAssignments.forEach(assignment => {
            assignment.subject.classes.forEach(classSubject => {
                classSubject.class.students.forEach(student => {
                    if (!studentsMap.has(student.id)) {
                        studentsMap.set(student.id, student);
                    }
                });
            });
        });

        const students = Array.from(studentsMap.values());

        res.json({ success: true, data: { students } });
    } catch (error) {
        console.error('Get my students error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch students' });
    }
};

// Get My Timetable
const getMyTimetable = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        const timetable = await tenantDb.timetableEntry.findMany({
            where: { teacherId: teacher.id },
            include: {
                subject: true,
                class: true
            },
            orderBy: [
                { dayOfWeek: 'asc' },
                { startTime: 'asc' }
            ]
        });

        res.json({ success: true, data: { timetable } });
    } catch (error) {
        console.error('Get my timetable error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch timetable' });
    }
};

// Get Student Progress
const getStudentProgress = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { studentId } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        // Get student's grades in subjects taught by this teacher
        const subjectIds = await tenantDb.subjectTeacher.findMany({
            where: { teacherId: teacher.id },
            select: { subjectId: true }
        });

        const grades = await tenantDb.grade.findMany({
            where: {
                studentId,
                subjectId: { in: subjectIds.map(s => s.subjectId) }
            },
            include: {
                exam: true,
                subject: true
            },
            orderBy: { createdAt: 'desc' }
        });

        const attendance = await tenantDb.attendance.findMany({
            where: { studentId },
            orderBy: { date: 'desc' },
            take: 30
        });

        const assignments = await tenantDb.assignmentSubmission.findMany({
            where: {
                studentId,
                assignment: {
                    teacherId: teacher.id
                }
            },
            include: {
                assignment: true
            }
        });

        res.json({
            success: true,
            data: {
                progress: {
                    grades,
                    attendance,
                    assignments
                }
            }
        });
    } catch (error) {
        console.error('Get student progress error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student progress' });
    }
};

// Add Student Remark
const addStudentRemark = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { studentId, remarkType, remark, severity } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        const studentRemark = await tenantDb.studentRemark.create({
            data: {
                studentId,
                teacherId: teacher.id,
                remarkType: remarkType || 'GENERAL',
                remark,
                severity: severity || null
            }
        });

        res.json({ success: true, message: 'Remark added successfully', data: { remark: studentRemark } });
    } catch (error) {
        console.error('Add student remark error:', error);
        res.status(500).json({ success: false, message: 'Failed to add remark' });
    }
};

// Add Behavioral Note
const addBehavioralNote = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { studentId, note, severity } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        const behavioralNote = await tenantDb.studentRemark.create({
            data: {
                studentId,
                teacherId: teacher.id,
                remarkType: 'BEHAVIORAL',
                remark: note,
                severity: severity || 'MEDIUM'
            }
        });

        res.json({ success: true, message: 'Behavioral note added successfully', data: { note: behavioralNote } });
    } catch (error) {
        console.error('Add behavioral note error:', error);
        res.status(500).json({ success: false, message: 'Failed to add behavioral note' });
    }
};

// Get Leave History
const getLeaveHistory = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        const leaves = await tenantDb.leaveApplication.findMany({
            where: { teacherId: teacher.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json({ success: true, data: { leaves } });
    } catch (error) {
        console.error('Get leave history error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch leave history' });
    }
};

// Send Message to Parent
const sendMessageToParent = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { studentId, message } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({
            where: { userId },
            include: { user: true }
        });

        // Get student's parent
        const parentStudent = await tenantDb.parentStudent.findFirst({
            where: { studentId },
            include: {
                parent: {
                    include: { user: true }
                }
            }
        });

        if (!parentStudent) {
            return res.status(404).json({ success: false, message: 'Parent not found for this student' });
        }

        // Send email to parent
        try {
            const { sendEmail } = require('../../services/email.service');
            await sendEmail({
                to: parentStudent.parent.user.email,
                subject: `Message from Teacher - ${teacher.user.fullName}`,
                template: 'parentCredentialsEmail', // Reuse template or create new one
                data: {
                    parentName: parentStudent.parent.user.fullName,
                    email: parentStudent.parent.user.email,
                    password: '', // Not needed
                    studentName: '', // Get from student if needed
                    loginUrl: process.env.FRONTEND_URL || 'http://localhost:5173'
                }
            });
        } catch (emailError) {
            console.error('Failed to send email:', emailError);
        }

        res.json({ success: true, message: 'Message sent successfully' });
    } catch (error) {
        console.error('Send message to parent error:', error);
        res.status(500).json({ success: false, message: 'Failed to send message' });
    }
};

// Schedule Parent Meeting
const scheduleParentMeeting = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { studentId, meetingDate, purpose } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        // Create a remark as meeting schedule (or create separate Meeting model if needed)
        const meeting = await tenantDb.studentRemark.create({
            data: {
                studentId,
                teacherId: teacher.id,
                remarkType: 'GENERAL',
                remark: `Parent Meeting Scheduled: ${purpose} on ${new Date(meetingDate).toLocaleDateString('en-IN')}`,
                severity: null
            }
        });

        res.json({ success: true, message: 'Meeting scheduled successfully', data: { meeting } });
    } catch (error) {
        console.error('Schedule parent meeting error:', error);
        res.status(500).json({ success: false, message: 'Failed to schedule meeting' });
    }
};

// Get My Messages
const getMyMessages = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        // Get remarks where teacher is involved (as a simple message system)
        const messages = await tenantDb.studentRemark.findMany({
            where: { teacherId: teacher.id },
            include: {
                student: {
                    include: { user: true }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 50
        });

        res.json({ success: true, data: { messages } });
    } catch (error) {
        console.error('Get my messages error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
};

// Get Class Performance
const getClassPerformance = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { classId } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        // Get subjects taught by teacher in this class
        const subjectTeachers = await tenantDb.subjectTeacher.findMany({
            where: { teacherId: teacher.id },
            include: {
                subject: {
                    include: {
                        classes: {
                            where: { classId }
                        }
                    }
                }
            }
        });

        const subjectIds = subjectTeachers.map(st => st.subjectId);

        // Get all grades for these subjects in this class
        const grades = await tenantDb.grade.findMany({
            where: {
                subjectId: { in: subjectIds },
                student: { classId }
            },
            include: {
                student: {
                    include: { user: true }
                },
                subject: true,
                exam: true
            }
        });

        // Calculate average performance
        const totalMarks = grades.reduce((sum, g) => sum + (g.marksObtained || 0), 0);
        const averagePercentage = grades.length > 0 ? (totalMarks / grades.length) : 0;

        res.json({
            success: true,
            data: {
                performance: {
                    grades,
                    averagePercentage,
                    totalStudents: new Set(grades.map(g => g.studentId)).size
                }
            }
        });
    } catch (error) {
        console.error('Get class performance error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch class performance' });
    }
};

// Get My Profile
const getMyProfile = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({
            where: { userId },
            include: {
                user: true,
                subjectAssignments: {
                    include: {
                        subject: true
                    }
                },
                classTeacher: true
            }
        });

        res.json({ success: true, data: { profile: teacher } });
    } catch (error) {
        console.error('Get my profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch profile' });
    }
};

// Update My Profile
const updateMyProfile = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { fullName, phone, qualification, specialization, experience } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        // Update user details
        await tenantDb.user.update({
            where: { id: userId },
            data: {
                ...(fullName && { fullName }),
                ...(phone && { phone })
            }
        });

        // Update teacher details
        await tenantDb.teacher.update({
            where: { id: teacher.id },
            data: {
                ...(qualification && { qualification }),
                ...(specialization && { specialization }),
                ...(experience !== undefined && { experience: parseInt(experience) })
            }
        });

        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Update my profile error:', error);
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
};

// Change Password
const changePassword = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { currentPassword, newPassword } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);
        const bcrypt = require('bcrypt');
        const { hashPassword } = require('../../utils/encryption.util');

        const user = await tenantDb.user.findUnique({ where: { id: userId } });

        // Verify current password
        const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
        if (!isValid) {
            return res.status(400).json({ success: false, message: 'Current password is incorrect' });
        }

        // Hash and update new password
        const hashedPassword = await hashPassword(newPassword);
        await tenantDb.user.update({
            where: { id: userId },
            data: { passwordHash: hashedPassword }
        });

        res.json({ success: true, message: 'Password changed successfully' });
    } catch (error) {
        console.error('Change password error:', error);
        res.status(500).json({ success: false, message: 'Failed to change password' });
    }
};

// Get My Resources
const getMyResources = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        const resources = await tenantDb.teacherResource.findMany({
            where: { teacherId: teacher.id },
            orderBy: { createdAt: 'desc' }
        });

        res.json({
            success: true,
            data: {
                resources,
                count: resources.length
            }
        });
    } catch (error) {
        console.error('Get my resources error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch resources' });
    }
};

// Upload Resource
const uploadResource = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { fileName, fileType, fileSize, fileUrl, description, category } = req.body;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        const resource = await tenantDb.teacherResource.create({
            data: {
                teacherId: teacher.id,
                fileName,
                fileType,
                fileSize: parseInt(fileSize),
                fileUrl,
                description: description || null,
                category: category || null
            }
        });

        res.json({
            success: true,
            message: 'Resource uploaded successfully',
            data: { resource }
        });
    } catch (error) {
        console.error('Upload resource error:', error);
        res.status(500).json({ success: false, message: 'Failed to upload resource' });
    }
};

// Delete Resource
const deleteResource = async (req, res) => {
    try {
        const { id: userId, tenantId } = req.user;
        const { id } = req.params;
        const tenantDb = getTenantPrismaClient(tenantId);

        const teacher = await tenantDb.teacher.findFirst({ where: { userId } });

        // Verify resource belongs to this teacher
        const resource = await tenantDb.teacherResource.findFirst({
            where: { id, teacherId: teacher.id }
        });

        if (!resource) {
            return res.status(404).json({ success: false, message: 'Resource not found' });
        }

        await tenantDb.teacherResource.delete({ where: { id } });

        res.json({
            success: true,
            message: 'Resource deleted successfully'
        });
    } catch (error) {
        console.error('Delete resource error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete resource' });
    }
};

module.exports = {
    getDashboard,
    getMyClasses,
    getMyStudents,
    getMyTimetable,
    getStudentProgress,
    addStudentRemark,
    addBehavioralNote,
    applyLeave,
    getLeaveBalance,
    getLeaveHistory,
    sendMessageToParent,
    scheduleParentMeeting,
    getMyMessages,
    getClassPerformance,
    getMyProfile,
    updateMyProfile,
    changePassword,
    getMyResources,
    uploadResource,
    deleteResource,
};
