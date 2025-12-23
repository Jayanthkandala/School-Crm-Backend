const tenantDb = require('../../utils/tenantDb');

exports.getStudentDisciplinaryRecords = async (req, res) => {
    try {
        const { studentId } = req.params;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const records = await prisma.disciplinaryAction.findMany({
            where: { studentId },
            orderBy: { actionDate: 'desc' }
        });

        res.json({ success: true, data: records });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch disciplinary records' });
    }
};

exports.addDisciplinaryAction = async (req, res) => {
    try {
        const { studentId, actionType, reason, severity, actionTaken, actionDate } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const record = await prisma.disciplinaryAction.create({
            data: {
                studentId,
                actionType,
                reason,
                description: reason, // Using reason as description for now
                severity,
                actionTaken,
                actionDate: new Date(actionDate),
                issuedBy: req.user.id
            }
        });

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Add Disciplinary Action Error:', error);
        res.status(500).json({ success: false, message: 'Failed to add disciplinary action' });
    }
};
