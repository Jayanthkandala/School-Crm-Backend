const tenantDb = require('../../utils/tenantDb');

// Health Records
exports.getStudentHealthRecords = async (req, res) => {
    try {
        const { studentId } = req.params;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const records = await prisma.healthRecord.findMany({
            where: { studentId },
            orderBy: { recordDate: 'desc' }
        });

        res.json({ success: true, data: records });
    } catch (error) {
        console.error('Get Health Records Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch health records' });
    }
};

exports.addHealthRecord = async (req, res) => {
    try {
        const { studentId, recordDate, recordType, description, diagnosis, treatment, prescribedBy } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const record = await prisma.healthRecord.create({
            data: {
                studentId,
                recordDate: new Date(recordDate),
                recordType,
                description,
                diagnosis,
                treatment,
                prescribedBy
            }
        });

        res.json({ success: true, data: record });
    } catch (error) {
        console.error('Add Health Record Error:', error);
        res.status(500).json({ success: false, message: 'Failed to add health record' });
    }
};

// Vaccinations
exports.getStudentVaccinations = async (req, res) => {
    try {
        const { studentId } = req.params;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const vaccinations = await prisma.vaccination.findMany({
            where: { studentId },
            orderBy: { administeredOn: 'desc' }
        });

        res.json({ success: true, data: vaccinations });
    } catch (error) {
        console.error('Get Vaccinations Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch vaccinations' });
    }
};

exports.addVaccination = async (req, res) => {
    try {
        const { studentId, vaccineName, doseNumber, administeredOn, nextDueDate, administeredBy, location } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const vaccination = await prisma.vaccination.create({
            data: {
                studentId,
                vaccineName,
                doseNumber: parseInt(doseNumber),
                administeredOn: new Date(administeredOn),
                nextDueDate: nextDueDate ? new Date(nextDueDate) : null,
                administeredBy,
                location
            }
        });

        res.json({ success: true, data: vaccination });
    } catch (error) {
        console.error('Add Vaccination Error:', error);
        res.status(500).json({ success: false, message: 'Failed to add vaccination' });
    }
};
