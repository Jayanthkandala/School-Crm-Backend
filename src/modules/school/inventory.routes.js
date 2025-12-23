const express = require('express');
const router = express.Router();
const inventoryController = require('./inventory.controller');
const { requireSchoolRole } = require('../../middleware/permission.middleware');

// Only admin/accountant can manage inventory
router.use(requireSchoolRole('SCHOOL_ADMIN', 'PRINCIPAL', 'ACCOUNTANT'));

/**
 * @swagger
 * tags:
 *   name: School - Inventory
 *   description: Inventory items and transaction management
 */

/**
 * @swagger
 * /school/inventory/categories:
 *   get:
 *     summary: Get inventory categories
 *     tags: [School - Inventory]
 *     responses:
 *       200:
 *         description: List of categories
 *   post:
 *     summary: Add an inventory category
 *     tags: [School - Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [categoryName]
 *             properties:
 *               categoryName:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Category created
 */
// Categories
router.get('/categories', inventoryController.getCategories);
router.post('/categories', inventoryController.addCategory);

/**
 * @swagger
 * /school/inventory/items:
 *   get:
 *     summary: Get inventory items
 *     tags: [School - Inventory]
 *     responses:
 *       200:
 *         description: List of items
 *   post:
 *     summary: Add an inventory item
 *     tags: [School - Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemName, categoryId, quantity]
 *             properties:
 *               itemName:
 *                 type: string
 *               categoryId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item created
 */
// Items
router.get('/items', inventoryController.getItems);
router.post('/items', inventoryController.addItem);

/**
 * @swagger
 * /school/inventory/transactions:
 *   post:
 *     summary: Record inventory transaction (Stock In/Out)
 *     tags: [School - Inventory]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, transactionType, quantity]
 *             properties:
 *               itemId:
 *                 type: string
 *               transactionType:
 *                 type: string
 *                 enum: [IN, OUT]
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Transaction recorded
 */
// Transactions
router.post('/transactions', inventoryController.addTransaction);

module.exports = router;
