const { getTenantPrismaClient } = require('../../utils/tenantDb');

/**
 * Accountant Dashboard
 */
const getDashboard = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);

        // Today's collection
        const todayPayments = await tenantDb.feePayment.aggregate({
            where: {
                paymentDate: {
                    gte: today,
                },
                status: 'SUCCESS',
            },
            _sum: {
                amount: true,
            },
        });

        // Month's collection
        const monthPayments = await tenantDb.feePayment.aggregate({
            where: {
                paymentDate: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
                status: 'SUCCESS',
            },
            _sum: {
                amount: true,
            },
        });

        // Pending fees
        const pendingInvoices = await tenantDb.feeInvoice.aggregate({
            where: {
                status: {
                    in: ['PENDING', 'PARTIAL', 'OVERDUE'],
                },
            },
            _sum: {
                total: true,
            },
        });

        // Month's expenses
        const monthExpenses = await tenantDb.expense.aggregate({
            where: {
                date: {
                    gte: startOfMonth,
                    lte: endOfMonth,
                },
            },
            _sum: {
                amount: true,
            },
        });

        // Recent transactions (last 10)
        const recentTransactions = await tenantDb.feePayment.findMany({
            take: 10,
            orderBy: {
                paymentDate: 'desc',
            },
            include: {
                invoice: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });

        // Defaulters (overdue invoices)
        const defaulters = await tenantDb.feeInvoice.findMany({
            where: {
                status: 'OVERDUE',
            },
            take: 10,
            orderBy: {
                dueDate: 'asc',
            },
            include: {
                student: {
                    include: {
                        user: {
                            select: {
                                fullName: true,
                                phone: true,
                            },
                        },
                    },
                },
            },
        });

        res.json({
            success: true,
            data: {
                todayCollection: todayPayments._sum.amount || 0,
                monthCollection: monthPayments._sum.amount || 0,
                pendingFees: pendingInvoices._sum.total || 0,
                expenses: monthExpenses._sum.amount || 0,
                recentTransactions: recentTransactions.map(t => ({
                    id: t.id,
                    studentName: t.invoice.student.user.fullName,
                    amount: t.amount,
                    paymentMethod: t.paymentMethod,
                    paymentDate: t.paymentDate,
                    status: t.status,
                })),
                defaulters: defaulters.map(d => ({
                    id: d.id,
                    studentName: d.student.user.fullName,
                    phone: d.student.user.phone,
                    amount: d.total,
                    dueDate: d.dueDate,
                    daysOverdue: Math.floor((new Date() - new Date(d.dueDate)) / (1000 * 60 * 60 * 24)),
                })),
            },
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard',
        });
    }
};

/**
 * Get today's fee collection
 */
const getTodayCollection = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const payments = await tenantDb.feePayment.findMany({
            where: {
                paymentDate: {
                    gte: today,
                },
                status: 'SUCCESS',
            },
            include: {
                invoice: {
                    include: {
                        student: {
                            include: {
                                user: {
                                    select: {
                                        fullName: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: {
                paymentDate: 'desc',
            },
        });

        const totalAmount = payments.reduce((sum, p) => sum + Number(p.amount), 0);

        res.json({
            success: true,
            data: {
                totalAmount,
                count: payments.length,
                payments: payments.map(p => ({
                    id: p.id,
                    studentName: p.invoice.student.user.fullName,
                    amount: p.amount,
                    paymentMethod: p.paymentMethod,
                    paymentDate: p.paymentDate,
                    transactionId: p.transactionId,
                })),
            },
        });
    } catch (error) {
        console.error('Get collection error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch collection',
        });
    }
};

/**
 * Get all expenses
 */
const getAllExpenses = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { startDate, endDate, category } = req.query;

        const where = {};

        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        if (category) {
            where.category = category;
        }

        const expenses = await tenantDb.expense.findMany({
            where,
            orderBy: {
                date: 'desc',
            },
        });

        const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        res.json({
            success: true,
            data: {
                expenses,
                total,
                count: expenses.length,
            },
        });
    } catch (error) {
        console.error('Get expenses error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch expenses',
        });
    }
};

/**
 * Create expense
 */
const createExpense = async (req, res) => {
    try {
        const { tenantId, id: userId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { category, amount, description, date, paymentMethod, billNumber } = req.body;

        // Validate category
        const validCategories = [
            'SALARIES',
            'UTILITIES',
            'MAINTENANCE',
            'STATIONERY',
            'TRANSPORT',
            'FOOD',
            'EVENTS',
            'INFRASTRUCTURE',
            'OTHER',
        ];

        if (!validCategories.includes(category)) {
            return res.status(400).json({
                success: false,
                message: 'Invalid expense category',
            });
        }

        const expense = await tenantDb.expense.create({
            data: {
                category,
                amount: parseFloat(amount),
                description,
                date: new Date(date),
                paymentMethod,
                billNumber,
                createdBy: userId,
            },
        });

        res.status(201).json({
            success: true,
            message: 'Expense recorded successfully',
            data: { expense },
        });
    } catch (error) {
        console.error('Create expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to record expense',
        });
    }
};

/**
 * Update expense
 */
const updateExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const updates = req.body;

        // Don't allow updating createdBy
        delete updates.createdBy;

        const expense = await tenantDb.expense.update({
            where: { id },
            data: updates,
        });

        res.json({
            success: true,
            message: 'Expense updated successfully',
            data: { expense },
        });
    } catch (error) {
        console.error('Update expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to update expense',
        });
    }
};

/**
 * Delete expense
 */
const deleteExpense = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        await tenantDb.expense.delete({
            where: { id },
        });

        res.json({
            success: true,
            message: 'Expense deleted successfully',
        });
    } catch (error) {
        console.error('Delete expense error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to delete expense',
        });
    }
};

/**
 * Get expense report
 */
const getExpenseReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { startDate, endDate } = req.query;

        const where = {};
        if (startDate && endDate) {
            where.date = {
                gte: new Date(startDate),
                lte: new Date(endDate),
            };
        }

        const expenses = await tenantDb.expense.findMany({
            where,
        });

        // Group by category
        const byCategory = expenses.reduce((acc, expense) => {
            const category = expense.category;
            if (!acc[category]) {
                acc[category] = 0;
            }
            acc[category] += Number(expense.amount);
            return acc;
        }, {});

        // Group by month
        const byMonth = expenses.reduce((acc, expense) => {
            const month = new Date(expense.date).toISOString().slice(0, 7); // YYYY-MM
            if (!acc[month]) {
                acc[month] = 0;
            }
            acc[month] += Number(expense.amount);
            return acc;
        }, {});

        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

        res.json({
            success: true,
            data: {
                totalExpenses,
                byCategory: Object.entries(byCategory).map(([category, amount]) => ({
                    category,
                    amount,
                })),
                byMonth: Object.entries(byMonth).map(([month, amount]) => ({
                    month,
                    amount,
                })),
            },
        });
    } catch (error) {
        console.error('Get report error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report',
        });
    }
};

/**
 * Get all salaries
 */
const getAllSalaries = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { month, year } = req.query;

        const where = {};
        if (month && year) {
            where.month = `${year}-${month.toString().padStart(2, '0')}`;
        }

        const salaries = await tenantDb.salary.findMany({
            where,
            orderBy: {
                month: 'desc',
            },
        });

        const total = salaries.reduce((sum, s) => sum + Number(s.netSalary), 0);

        res.json({
            success: true,
            data: {
                salaries,
                total,
                count: salaries.length,
            },
        });
    } catch (error) {
        console.error('Get salaries error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch salaries',
        });
    }
};

/**
 * Generate salary slips
 */
const generateSalarySlips = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { month, year } = req.body;

        const monthString = `${year}-${month.toString().padStart(2, '0')}`;

        // Get all active teachers
        const teachers = await tenantDb.teacher.findMany({
            where: {
                status: 'ACTIVE',
            },
            include: {
                user: true,
            },
        });

        let generated = 0;

        for (const teacher of teachers) {
            // Check if salary already exists
            const existing = await tenantDb.salary.findUnique({
                where: {
                    teacherId_month: {
                        teacherId: teacher.id,
                        month: monthString,
                    },
                },
            });

            if (existing) {
                continue; // Skip if already generated
            }

            const basicSalary = Number(teacher.salary) || 0;

            // Indian salary calculations
            const hra = basicSalary * 0.40; // 40% HRA
            const da = basicSalary * 0.12; // 12% DA
            const grossSalary = basicSalary + hra + da;

            const pf = basicSalary * 0.12; // 12% PF (on basic)
            const tds = grossSalary > 50000 ? grossSalary * 0.10 : 0; // 10% TDS if > 50k

            const netSalary = grossSalary - pf - tds;

            await tenantDb.salary.create({
                data: {
                    teacherId: teacher.id,
                    month: monthString,
                    basicSalary,
                    hra,
                    da,
                    pf,
                    tds,
                    otherDeductions: 0,
                    netSalary,
                    status: 'PENDING',
                },
            });

            generated++;
        }

        res.json({
            success: true,
            message: 'Salary slips generated successfully',
            data: {
                generated,
                month: monthString,
            },
        });
    } catch (error) {
        console.error('Generate slips error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate salary slips',
        });
    }
};

/**
 * Get salary slip
 */
const getSalarySlip = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const salary = await tenantDb.salary.findUnique({
            where: { id },
        });

        if (!salary) {
            return res.status(404).json({
                success: false,
                message: 'Salary slip not found',
            });
        }

        // TODO: Generate PDF using a library like pdfkit or puppeteer
        // For now, return data

        res.json({
            success: true,
            data: {
                salarySlip: salary,
                pdfUrl: null, // TODO: Generate PDF and upload to S3/Cloudinary
            },
        });
    } catch (error) {
        console.error('Get slip error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch salary slip',
        });
    }
};

/**
 * Get profit & loss report
 */
const getProfitLossReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.gte = new Date(startDate);
            dateFilter.lte = new Date(endDate);
        }

        // Income from fees
        const feeIncome = await tenantDb.feePayment.aggregate({
            where: {
                paymentDate: dateFilter,
                status: 'SUCCESS',
            },
            _sum: {
                amount: true,
            },
        });

        // Expenses
        const expenses = await tenantDb.expense.findMany({
            where: {
                date: dateFilter,
            },
        });

        const expensesByCategory = expenses.reduce((acc, exp) => {
            if (!acc[exp.category]) {
                acc[exp.category] = 0;
            }
            acc[exp.category] += Number(exp.amount);
            return acc;
        }, {});

        const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
        const totalIncome = Number(feeIncome._sum.amount) || 0;
        const profit = totalIncome - totalExpenses;

        res.json({
            success: true,
            data: {
                income: {
                    fees: totalIncome,
                    other: 0,
                    total: totalIncome,
                },
                expenses: {
                    ...expensesByCategory,
                    total: totalExpenses,
                },
                profit,
                profitMargin: totalIncome > 0 ? ((profit / totalIncome) * 100).toFixed(2) : 0,
            },
        });
    } catch (error) {
        console.error('Get P&L error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report',
        });
    }
};

/**
 * Get balance sheet
 */
const getBalanceSheet = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        // Assets: Pending fees (receivables)
        const receivables = await tenantDb.feeInvoice.aggregate({
            where: {
                status: {
                    in: ['PENDING', 'PARTIAL', 'OVERDUE'],
                },
            },
            _sum: {
                total: true,
            },
        });

        // Cash: Collected fees
        const cash = await tenantDb.feePayment.aggregate({
            where: {
                status: 'SUCCESS',
            },
            _sum: {
                amount: true,
            },
        });

        // Liabilities: Unpaid salaries
        const payables = await tenantDb.salary.aggregate({
            where: {
                status: 'PENDING',
            },
            _sum: {
                netSalary: true,
            },
        });

        const totalAssets = Number(cash._sum.amount || 0) + Number(receivables._sum.total || 0);
        const totalLiabilities = Number(payables._sum.netSalary || 0);

        res.json({
            success: true,
            data: {
                assets: {
                    cash: cash._sum.amount || 0,
                    bank: 0, // TODO: Integrate with bank
                    receivables: receivables._sum.total || 0,
                    total: totalAssets,
                },
                liabilities: {
                    payables: payables._sum.netSalary || 0,
                    loans: 0, // TODO: Add loans table
                    total: totalLiabilities,
                },
                netWorth: totalAssets - totalLiabilities,
            },
        });
    } catch (error) {
        console.error('Get balance sheet error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate balance sheet',
        });
    }
};

/**
 * Get cash flow report
 */
const getCashFlowReport = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { startDate, endDate } = req.query;

        const dateFilter = {};
        if (startDate && endDate) {
            dateFilter.gte = new Date(startDate);
            dateFilter.lte = new Date(endDate);
        }

        // Inflows: Fee payments
        const inflows = await tenantDb.feePayment.findMany({
            where: {
                paymentDate: dateFilter,
                status: 'SUCCESS',
            },
            select: {
                amount: true,
                paymentDate: true,
                paymentMethod: true,
            },
        });

        // Outflows: Expenses
        const outflows = await tenantDb.expense.findMany({
            where: {
                date: dateFilter,
            },
            select: {
                amount: true,
                date: true,
                category: true,
            },
        });

        const totalInflows = inflows.reduce((sum, i) => sum + Number(i.amount), 0);
        const totalOutflows = outflows.reduce((sum, o) => sum + Number(o.amount), 0);
        const netCashFlow = totalInflows - totalOutflows;

        res.json({
            success: true,
            data: {
                inflows: inflows.map(i => ({
                    amount: i.amount,
                    date: i.paymentDate,
                    source: 'Fee Payment',
                    method: i.paymentMethod,
                })),
                outflows: outflows.map(o => ({
                    amount: o.amount,
                    date: o.date,
                    category: o.category,
                })),
                summary: {
                    totalInflows,
                    totalOutflows,
                    netCashFlow,
                },
            },
        });
    } catch (error) {
        console.error('Get cash flow error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to generate report',
        });
    }
};

/**
 * Bank reconciliation
 */
const bankReconciliation = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { bankStatements } = req.body;

        // Bank statements format: [{ date, amount, reference, type: 'CREDIT'|'DEBIT' }]

        const matched = [];
        const unmatched = [];
        const discrepancies = [];

        for (const statement of bankStatements) {
            if (statement.type === 'CREDIT') {
                // Match with fee payments
                const payment = await tenantDb.feePayment.findFirst({
                    where: {
                        amount: parseFloat(statement.amount),
                        paymentDate: {
                            gte: new Date(statement.date),
                            lte: new Date(new Date(statement.date).getTime() + 24 * 60 * 60 * 1000),
                        },
                        status: 'SUCCESS',
                    },
                });

                if (payment) {
                    matched.push({
                        bankRef: statement.reference,
                        systemRef: payment.transactionId,
                        amount: statement.amount,
                        date: statement.date,
                    });
                } else {
                    unmatched.push(statement);
                }
            } else if (statement.type === 'DEBIT') {
                // Match with expenses
                const expense = await tenantDb.expense.findFirst({
                    where: {
                        amount: parseFloat(statement.amount),
                        date: {
                            gte: new Date(statement.date),
                            lte: new Date(new Date(statement.date).getTime() + 24 * 60 * 60 * 1000),
                        },
                    },
                });

                if (expense) {
                    matched.push({
                        bankRef: statement.reference,
                        systemRef: expense.id,
                        amount: statement.amount,
                        date: statement.date,
                    });
                } else {
                    unmatched.push(statement);
                }
            }
        }

        res.json({
            success: true,
            message: 'Reconciliation completed',
            data: {
                matched: matched.length,
                unmatched: unmatched.length,
                discrepancies: unmatched,
                matchedTransactions: matched,
            },
        });
    } catch (error) {
        console.error('Reconciliation error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to reconcile',
        });
    }
};

module.exports = {
    getDashboard,
    getTodayCollection,
    getAllExpenses,
    createExpense,
    updateExpense,
    deleteExpense,
    getExpenseReport,
    getAllSalaries,
    generateSalarySlips,
    getSalarySlip,
    getProfitLossReport,
    getBalanceSheet,
    getCashFlowReport,
    bankReconciliation,
};
