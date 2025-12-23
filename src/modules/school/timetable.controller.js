const { getTenantPrismaClient } = require('../../utils/tenantDb');

const getTimetable = async (req, res) => {
    try {
        const { classId } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const timetable = await tenantDb.timetableEntry.findMany({
            where: { classId },
            include: {
                subject: true,
                class: {
                    select: {
                        className: true,
                        section: true,
                    },
                },
            },
            orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
        });

        // Group by day of week
        const groupedTimetable = timetable.reduce((acc, entry) => {
            const day = entry.dayOfWeek;
            if (!acc[day]) acc[day] = [];
            acc[day].push(entry);
            return acc;
        }, {});

        res.json({ success: true, data: { timetable, groupedTimetable } });
    } catch (error) {
        console.error('Get timetable error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch timetable' });
    }
};

const getClassTimetable = getTimetable; // Alias

const createTimetableEntry = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, subjectId, dayOfWeek, startTime, endTime, room } = req.body;

        // Check for conflicts
        const conflict = await tenantDb.timetableEntry.findFirst({
            where: {
                classId,
                dayOfWeek: parseInt(dayOfWeek),
                OR: [
                    {
                        AND: [
                            { startTime: { lte: startTime } },
                            { endTime: { gt: startTime } },
                        ],
                    },
                    {
                        AND: [
                            { startTime: { lt: endTime } },
                            { endTime: { gte: endTime } },
                        ],
                    },
                ],
            },
        });

        if (conflict) {
            return res.status(400).json({
                success: false,
                message: 'Time slot conflicts with existing entry'
            });
        }

        const entry = await tenantDb.timetableEntry.create({
            data: {
                classId,
                subjectId,
                dayOfWeek: parseInt(dayOfWeek),
                startTime,
                endTime,
                room,
            },
            include: {
                subject: true,
                class: true,
            },
        });

        res.status(201).json({ success: true, data: { entry } });
    } catch (error) {
        console.error('Create timetable error:', error);
        res.status(500).json({ success: false, message: 'Failed to create timetable entry' });
    }
};

const updateTimetableEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { subjectId, dayOfWeek, startTime, endTime, room } = req.body;

        const entry = await tenantDb.timetableEntry.update({
            where: { id },
            data: {
                ...(subjectId && { subjectId }),
                ...(dayOfWeek !== undefined && { dayOfWeek: parseInt(dayOfWeek) }),
                ...(startTime && { startTime }),
                ...(endTime && { endTime }),
                ...(room && { room }),
            },
            include: {
                subject: true,
                class: true,
            },
        });

        res.json({ success: true, data: { entry } });
    } catch (error) {
        console.error('Update timetable error:', error);
        res.status(500).json({ success: false, message: 'Failed to update timetable entry' });
    }
};

const deleteTimetableEntry = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        await tenantDb.timetableEntry.delete({ where: { id } });

        res.json({ success: true, message: 'Timetable entry deleted successfully' });
    } catch (error) {
        console.error('Delete timetable error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete timetable entry' });
    }
};

const bulkCreateTimetable = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { entries } = req.body; // Array of timetable entries

        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Entries must be a non-empty array'
            });
        }

        const createdEntries = await Promise.all(
            entries.map(entry =>
                tenantDb.timetableEntry.create({
                    data: {
                        classId: entry.classId,
                        subjectId: entry.subjectId,
                        dayOfWeek: parseInt(entry.dayOfWeek),
                        startTime: entry.startTime,
                        endTime: entry.endTime,
                        room: entry.room,
                    },
                })
            )
        );

        res.status(201).json({
            success: true,
            data: { entries: createdEntries, count: createdEntries.length },
            message: `Created ${createdEntries.length} timetable entries`
        });
    } catch (error) {
        console.error('Bulk create timetable error:', error);
        res.status(500).json({ success: false, message: 'Failed to create timetable entries' });
    }
};

module.exports = {
    getTimetable,
    getClassTimetable,
    createTimetableEntry,
    updateTimetableEntry,
    deleteTimetableEntry,
    bulkCreateTimetable,
};
