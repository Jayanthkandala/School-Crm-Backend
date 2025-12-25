const { getTenantPrismaClient } = require('../../utils/tenantDb');
const prisma = require('../../config/database');

const getSettings = async (req, res) => {
    try {
        const { tenantId } = req.user;

        // Get school details from platform database
        const school = await prisma.school.findUnique({
            where: { id: tenantId },
            select: {
                schoolName: true,
                adminEmail: true,
                adminPhone: true,
                address: true,
                city: true,
                state: true,
                pinCode: true,
                logoUrl: true,
                enabledModules: true,
            },
        });

        if (!school) {
            return res.status(404).json({ success: false, message: 'School not found' });
        }

        // Get tenant-specific settings (you can add a Settings model to tenant schema if needed)
        const settings = {
            school,
            academic: {
                currentAcademicYear: new Date().getFullYear().toString(),
                minAttendancePercentage: 75,
                lateArrivalTime: '09:00',
                workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
            },
            fees: {
                lateFeePercentage: 5,
                lateFeeGracePeriod: 7, // days
            },
            notifications: {
                emailEnabled: true,
                smsEnabled: false,
                pushEnabled: false,
            },
        };

        res.json({ success: true, data: settings });
    } catch (error) {
        console.error('getSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch settings' });
    }
};

const updateSettings = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const { school, academic, fees, notifications } = req.body;

        // Update school details in platform database
        if (school) {
            await prisma.school.update({
                where: { id: tenantId },
                data: {
                    ...(school.name && { schoolName: school.name }),
                    ...(school.email && { adminEmail: school.email }),
                    ...(school.phone && { adminPhone: school.phone }),
                    ...(school.address && { address: school.address }),
                    ...(school.city && { city: school.city }),
                    ...(school.state && { state: school.state }),
                    ...(school.pincode && { pinCode: school.pincode }),
                    ...(school.logo && { logoUrl: school.logo }),
                },
            });
        }

        // Store academic, fees, notifications settings in tenant database
        const tenantDb = getTenantPrismaClient(tenantId);

        // Upsert settings (create if doesn't exist, update if exists)
        const settings = await tenantDb.settings.upsert({
            where: { id: 'default' }, // We'll use a single settings record
            update: {
                ...(school?.name && { schoolName: school.name }),
                ...(school?.address && { schoolAddress: school.address }),
                ...(school?.email && { schoolEmail: school.email }),
                ...(school?.phone && { schoolPhone: school.phone }),
                ...(school?.logo && { schoolLogo: school.logo }),
                ...(academic?.currentYear && { currentAcademicYear: academic.currentYear }),
                ...(academic?.yearStartMonth && { academicYearStartMonth: parseInt(academic.yearStartMonth) }),
                ...(academic?.minAttendance && { minAttendancePercentage: parseInt(academic.minAttendance) }),
                ...(academic?.lateArrivalTime && { lateArrivalTime: academic.lateArrivalTime }),
                ...(academic?.workingDays && { workingDays: academic.workingDays }),
                ...(fees?.lateFeePercentage && { lateFeePercentage: parseInt(fees.lateFeePercentage) }),
                ...(fees?.gracePeriod && { lateFeeGracePeriod: parseInt(fees.gracePeriod) }),
                ...(notifications?.email !== undefined && { emailEnabled: notifications.email }),
                ...(notifications?.sms !== undefined && { smsEnabled: notifications.sms }),
                ...(notifications?.push !== undefined && { pushEnabled: notifications.push }),
            },
            create: {
                id: 'default',
                schoolName: school?.name,
                schoolAddress: school?.address,
                schoolEmail: school?.email,
                schoolPhone: school?.phone,
                schoolLogo: school?.logo,
                currentAcademicYear: academic?.currentYear,
                academicYearStartMonth: academic?.yearStartMonth ? parseInt(academic.yearStartMonth) : 4,
                minAttendancePercentage: academic?.minAttendance ? parseInt(academic.minAttendance) : 75,
                lateArrivalTime: academic?.lateArrivalTime || '09:30',
                workingDays: academic?.workingDays || ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'],
                lateFeePercentage: fees?.lateFeePercentage ? parseInt(fees.lateFeePercentage) : 5,
                lateFeeGracePeriod: fees?.gracePeriod ? parseInt(fees.gracePeriod) : 7,
                emailEnabled: notifications?.email !== undefined ? notifications.email : true,
                smsEnabled: notifications?.sms !== undefined ? notifications.sms : false,
                pushEnabled: notifications?.push !== undefined ? notifications.push : false,
            }
        });

        res.json({
            success: true,
            message: 'Settings updated successfully',
            data: { school, settings, academic, fees, notifications }
        });
    } catch (error) {
        console.error('updateSettings error:', error);
        res.status(500).json({ success: false, message: 'Failed to update settings' });
    }
};

module.exports = {
    getSettings,
    updateSettings,
};
