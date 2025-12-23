const { getTenantPrismaClient } = require('../../utils/tenantDb');
const XLSX = require('xlsx');
const { Parser } = require('json2csv');

/**
 * Generate comprehensive student report
 */
const generateStudentReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, format = 'json' } = req.query;

        const where = classId ? { classId } : {};

        const students = await tenantDb.student.findMany({
            where,
            include: {
                user: true,
                class: true,
                grades: {
                    include: {
                        exam: true,
                        subject: true,
                    },
                },
                feeInvoices: true,
                attendance: true,
            },
        });

        const reportData = students.map(student => {
            const totalAttendance = student.attendance.length;
            const presentDays = student.attendance.filter(a => a.status === 'PRESENT').length;
            const attendancePercentage = totalAttendance > 0
                ? ((presentDays / totalAttendance) * 100).toFixed(2)
                : 0;

            const totalFees = student.feeInvoices.reduce((sum, inv) => sum + Number(inv.total), 0);
            const paidFees = student.feeInvoices
                .filter(inv => inv.status === 'PAID')
                .reduce((sum, inv) => sum + Number(inv.total), 0);
            const pendingFees = totalFees - paidFees;

            const avgGrade = student.grades.length > 0
                ? student.grades.reduce((sum, g) => sum + Number(g.marksObtained), 0) / student.grades.length
                : 0;

            return {
                'Admission Number': student.admissionNumber,
                'Student Name': student.user.fullName,
                'Class': student.class.className,
                'Attendance %': attendancePercentage,
                'Average Marks': avgGrade.toFixed(2),
                'Total Fees': totalFees,
                'Paid Fees': paidFees,
                'Pending Fees': pendingFees,
                'Status': student.status,
            };
        });

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(reportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Student Report');

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', 'attachment; filename=student-report.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } else if (format === 'csv') {
            const parser = new Parser();
            const csv = parser.parse(reportData);

            res.setHeader('Content-Disposition', 'attachment; filename=student-report.csv');
            res.setHeader('Content-Type', 'text/csv');
            res.send(csv);
        } else {
            res.json({
                success: true,
                data: { report: reportData },
            });
        }
    } catch (error) {
        console.error('Generate student report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
};

/**
 * Generate financial report
 */
const generateFinancialReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { fromDate, toDate, format = 'json' } = req.query;

        const where = {};
        if (fromDate && toDate) {
            where.createdAt = {
                gte: new Date(fromDate),
                lte: new Date(toDate),
            };
        }

        const [invoices, payments, expenses] = await Promise.all([
            tenantDb.feeInvoice.findMany({
                where,
                include: {
                    student: {
                        include: {
                            user: true,
                            class: true,
                        },
                    },
                    payments: true,
                },
            }),
            tenantDb.feePayment.findMany({
                where: {
                    ...where,
                    status: 'SUCCESS',
                },
            }),
            tenantDb.expense ? tenantDb.expense.findMany({ where }) : [],
        ]);

        const totalRevenue = payments.reduce((sum, p) => sum + Number(p.amount), 0);
        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const pendingFees = invoices
            .filter(inv => inv.status !== 'PAID')
            .reduce((sum, inv) => sum + Number(inv.total), 0);

        const reportData = {
            period: {
                from: fromDate,
                to: toDate,
            },
            summary: {
                totalRevenue,
                totalExpenses,
                netProfit: totalRevenue - totalExpenses,
                pendingFees,
            },
            invoices: invoices.map(inv => ({
                'Invoice Number': inv.invoiceNumber,
                'Student': inv.student.user.fullName,
                'Class': inv.student.class.className,
                'Amount': inv.total,
                'Status': inv.status,
                'Due Date': new Date(inv.dueDate).toLocaleDateString('en-IN'),
            })),
            payments: payments.map(p => ({
                'Date': new Date(p.paymentDate).toLocaleDateString('en-IN'),
                'Amount': p.amount,
                'Method': p.paymentMethod,
                'Transaction ID': p.transactionId || '',
            })),
        };

        if (format === 'excel') {
            const wb = XLSX.utils.book_new();

            // Summary sheet
            const summaryWs = XLSX.utils.json_to_sheet([reportData.summary]);
            XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

            // Invoices sheet
            const invoicesWs = XLSX.utils.json_to_sheet(reportData.invoices);
            XLSX.utils.book_append_sheet(wb, invoicesWs, 'Invoices');

            // Payments sheet
            const paymentsWs = XLSX.utils.json_to_sheet(reportData.payments);
            XLSX.utils.book_append_sheet(wb, paymentsWs, 'Payments');

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', 'attachment; filename=financial-report.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } else {
            res.json({
                success: true,
                data: reportData,
            });
        }
    } catch (error) {
        console.error('Generate financial report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
};

/**
 * Generate attendance summary report
 */
const generateAttendanceSummary = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { classId, month, year, format = 'json' } = req.query;

        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0);

        const students = await tenantDb.student.findMany({
            where: { classId, status: 'ACTIVE' },
            include: {
                user: true,
                attendance: {
                    where: {
                        date: {
                            gte: startDate,
                            lte: endDate,
                        },
                    },
                },
            },
        });

        const reportData = students.map(student => {
            const totalDays = student.attendance.length;
            const presentDays = student.attendance.filter(a => a.status === 'PRESENT').length;
            const absentDays = student.attendance.filter(a => a.status === 'ABSENT').length;
            const leaveDays = student.attendance.filter(a => a.status === 'LEAVE').length;
            const percentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(2) : 0;

            return {
                'Admission Number': student.admissionNumber,
                'Student Name': student.user.fullName,
                'Total Days': totalDays,
                'Present': presentDays,
                'Absent': absentDays,
                'Leave': leaveDays,
                'Attendance %': percentage,
            };
        });

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(reportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Attendance Summary');

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', 'attachment; filename=attendance-summary.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } else {
            res.json({
                success: true,
                data: { report: reportData },
            });
        }
    } catch (error) {
        console.error('Generate attendance summary error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
};

/**
 * Generate exam performance report
 */
const generateExamReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { examId, classId, format = 'json' } = req.query;

        const grades = await tenantDb.grade.findMany({
            where: {
                examId,
                student: { classId },
            },
            include: {
                student: {
                    include: {
                        user: true,
                    },
                },
                subject: true,
            },
        });

        // Group by student
        const studentGrades = {};
        grades.forEach(grade => {
            if (!studentGrades[grade.studentId]) {
                studentGrades[grade.studentId] = {
                    student: grade.student,
                    grades: [],
                    total: 0,
                    maxTotal: 0,
                };
            }
            studentGrades[grade.studentId].grades.push(grade);
            studentGrades[grade.studentId].total += Number(grade.marksObtained);
            studentGrades[grade.studentId].maxTotal += Number(grade.maxMarks);
        });

        const reportData = Object.values(studentGrades).map(sg => {
            const percentage = (sg.total / sg.maxTotal * 100).toFixed(2);

            return {
                'Admission Number': sg.student.admissionNumber,
                'Student Name': sg.student.user.fullName,
                'Total Marks': sg.total,
                'Max Marks': sg.maxTotal,
                'Percentage': percentage,
                'Result': percentage >= 33 ? 'PASS' : 'FAIL',
            };
        });

        // Sort by percentage
        reportData.sort((a, b) => parseFloat(b.Percentage) - parseFloat(a.Percentage));

        if (format === 'excel') {
            const ws = XLSX.utils.json_to_sheet(reportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Exam Report');

            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

            res.setHeader('Content-Disposition', 'attachment; filename=exam-report.xlsx');
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.send(buffer);
        } else {
            res.json({
                success: true,
                data: { report: reportData },
            });
        }
    } catch (error) {
        console.error('Generate exam report error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
};

module.exports = {
    generateStudentReport,
    generateFinancialReport,
    generateAttendanceSummary,
    generateExamReport,
};
