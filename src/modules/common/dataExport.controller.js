const { getTenantPrismaClient } = require('../../utils/tenantDb');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');

/**
 * Export students to CSV
 */
const exportStudents = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { format = 'csv' } = req.query;

        const students = await tenantDb.student.findMany({
            include: {
                user: true,
                class: true,
            },
        });

        const data = students.map(s => ({
            'Admission Number': s.admissionNumber,
            'Student Name': s.user.fullName,
            'Email': s.user.email,
            'Phone': s.user.phone,
            'Class': s.class.className,
            'Section': s.class.section || '',
            'Date of Birth': s.dateOfBirth ? new Date(s.dateOfBirth).toLocaleDateString('en-IN') : '',
            'Gender': s.gender,
            'Aadhaar': s.aadhaarNumber || '',
            'Category': s.category,
            'Admission Date': new Date(s.admissionDate).toLocaleDateString('en-IN'),
            'Status': s.status,
        }));

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Students');

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', 'attachment; filename=students.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } else {
            const parser = new Parser();
            const csv = parser.parse(data);

            res.setHeader('Content-Disposition', 'attachment; filename=students.csv');
            res.setHeader('Content-Type', 'text/csv');
            res.send(csv);
        }
    } catch (error) {
        console.error('Export students error:', error);
        res.status(500).json({ success: false, message: 'Failed to export students' });
    }
};

/**
 * Import students from CSV/Excel
 */
const importStudents = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const bcrypt = require('bcryptjs');
        const { generateAdmissionNumber, generateRandomPassword } = require('../../utils/generators');

        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No file uploaded' });
        }

        let data = [];

        if (req.file.mimetype.includes('excel') || req.file.originalname.endsWith('.xlsx')) {
            const workbook = XLSX.read(req.file.buffer);
            const sheetName = workbook.SheetNames[0];
            data = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        } else {
            // CSV parsing
            const csvData = req.file.buffer.toString();
            const lines = csvData.split('\n');
            const headers = lines[0].split(',');

            for (let i = 1; i < lines.length; i++) {
                if (lines[i].trim()) {
                    const values = lines[i].split(',');
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header.trim()] = values[index]?.trim();
                    });
                    data.push(obj);
                }
            }
        }

        let imported = 0;
        let failed = 0;
        const errors = [];

        for (const row of data) {
            try {
                const className = row['Class'] || row['class'];
                const classData = await tenantDb.class.findFirst({
                    where: { className },
                });

                if (!classData) {
                    throw new Error(`Class ${className} not found`);
                }

                const count = await tenantDb.student.count();
                const admissionNumber = generateAdmissionNumber(count + 1);
                const password = generateRandomPassword();
                const hashedPassword = await bcrypt.hash(password, 10);

                const user = await tenantDb.user.create({
                    data: {
                        fullName: row['Student Name'] || row['name'],
                        email: row['Email'] || row['email'],
                        phone: row['Phone'] || row['phone'],
                        passwordHash: hashedPassword,
                        role: 'STUDENT',
                    },
                });

                await tenantDb.student.create({
                    data: {
                        userId: user.id,
                        admissionNumber,
                        classId: classData.id,
                        dateOfBirth: row['Date of Birth'] ? new Date(row['Date of Birth']) : null,
                        gender: row['Gender'] || row['gender'] || 'MALE',
                        aadhaarNumber: row['Aadhaar'] || row['aadhaar'],
                        category: row['Category'] || row['category'] || 'GENERAL',
                        admissionDate: new Date(),
                        status: 'ACTIVE',
                    },
                });

                imported++;
            } catch (error) {
                failed++;
                errors.push({
                    row: row['Student Name'] || row['name'],
                    error: error.message,
                });
            }
        }

        res.json({
            success: true,
            message: 'Import completed',
            data: {
                imported,
                failed,
                errors: errors.slice(0, 10), // First 10 errors
            },
        });
    } catch (error) {
        console.error('Import students error:', error);
        res.status(500).json({ success: false, message: 'Failed to import students' });
    }
};

/**
 * Export teachers to CSV/Excel
 */
const exportTeachers = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { format = 'csv' } = req.query;

        const teachers = await tenantDb.teacher.findMany({
            include: {
                user: true,
            },
        });

        const data = teachers.map(t => ({
            'Employee ID': t.employeeId,
            'Name': t.user.fullName,
            'Email': t.user.email,
            'Phone': t.user.phone,
            'Qualification': t.qualification || '',
            'Specialization': t.specialization || '',
            'Experience (Years)': t.experience || 0,
            'Joining Date': new Date(t.joiningDate).toLocaleDateString('en-IN'),
            'Salary': t.salary || 0,
            'Status': t.isActive ? 'Active' : 'Inactive',
        }));

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(data);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Teachers');

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', 'attachment; filename=teachers.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } else {
            const parser = new Parser();
            const csv = parser.parse(data);

            res.setHeader('Content-Disposition', 'attachment; filename=teachers.csv');
            res.setHeader('Content-Type', 'text/csv');
            res.send(csv);
        }
    } catch (error) {
        console.error('Export teachers error:', error);
        res.status(500).json({ success: false, message: 'Failed to export teachers' });
    }
};

/**
 * Export all tenant data (GDPR compliance)
 */
const exportAllData = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const [students, teachers, classes, fees, attendance] = await Promise.all([
            tenantDb.student.findMany({ include: { user: true } }),
            tenantDb.teacher.findMany({ include: { user: true } }),
            tenantDb.class.findMany(),
            tenantDb.feeInvoice.findMany(),
            tenantDb.attendance.findMany(),
        ]);

        const exportData = {
            exportDate: new Date().toISOString(),
            tenantId,
            data: {
                students: students.length,
                teachers: teachers.length,
                classes: classes.length,
                fees: fees.length,
                attendance: attendance.length,
            },
            students,
            teachers,
            classes,
            fees,
            attendance,
        };

        res.setHeader('Content-Disposition', 'attachment; filename=school-data-export.json');
        res.setHeader('Content-Type', 'application/json');
        res.json(exportData);
    } catch (error) {
        console.error('Export all data error:', error);
        res.status(500).json({ success: false, message: 'Failed to export data' });
    }
};

module.exports = {
    exportStudents,
    importStudents,
    exportTeachers,
    exportAllData,
};
