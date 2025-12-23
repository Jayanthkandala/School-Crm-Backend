const express = require('express');
const router = express.Router();
const accountantController = require('./accountant.controller');
const { authenticateSchoolUser } = require('../../middleware/auth.middleware');

// Authentication handled at parent router level

// Middleware to verify user is accountant or admin
const requireAccountantOrAdmin = (req, res, next) => {
    if (!['ACCOUNTANT', 'SCHOOL_ADMIN', 'PRINCIPAL'].includes(req.user.role)) {
        return res.status(403).json({
            success: false,
            message: 'Access denied. Accountant or Admin access required.',
        });
    }
    next();
};

router.use(requireAccountantOrAdmin);

/**
 * @swagger
 * /school/accountant/dashboard:
 *   get:
 *     summary: Get accountant dashboard
 *     tags: [School - Accountant]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data
 */
router.get('/dashboard', accountantController.getDashboard);

router.get('/collection/today', accountantController.getTodayCollection);

// Expenses
router.get('/expenses', accountantController.getAllExpenses);
router.post('/expenses', accountantController.createExpense);
router.put('/expenses/:id', accountantController.updateExpense);
router.delete('/expenses/:id', accountantController.deleteExpense);
router.get('/expenses/report', accountantController.getExpenseReport);

// Salaries
router.get('/salaries', accountantController.getAllSalaries);
router.post('/salaries/generate', accountantController.generateSalarySlips);
router.get('/salaries/:id/slip', accountantController.getSalarySlip);

// Financial Reports
router.get('/reports/profit-loss', accountantController.getProfitLossReport);
router.get('/reports/balance-sheet', accountantController.getBalanceSheet);
router.get('/reports/cash-flow', accountantController.getCashFlowReport);

// Bank Reconciliation
router.post('/bank/reconcile', accountantController.bankReconciliation);

module.exports = router;
