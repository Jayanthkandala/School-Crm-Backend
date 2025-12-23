const tenantDb = require('../../utils/tenantDb');

// Sports List
exports.getAllSports = async (req, res) => {
    try {
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);
        const sports = await prisma.sport.findMany({
            include: {
                teams: true
            }
        });
        res.json({ success: true, data: sports });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch sports' });
    }
};

exports.addSport = async (req, res) => {
    try {
        const { sportName, coachName } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);
        const sport = await prisma.sport.create({
            data: { sportName, coachName }
        });
        res.json({ success: true, data: sport });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add sport' });
    }
};

// Teams
exports.createTeam = async (req, res) => {
    try {
        const { sportId, teamName, captainId } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);
        const team = await prisma.sportTeam.create({
            data: { sportId, teamName, captainId }
        });
        res.json({ success: true, data: team });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to create team' });
    }
};

// Players
exports.addPlayerToTeam = async (req, res) => {
    try {
        const { teamId, studentId, role } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);
        const player = await prisma.sportPlayer.create({
            data: { teamId, studentId, role }
        });
        res.json({ success: true, data: player });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add player' });
    }
};
