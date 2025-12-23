const tenantDb = require('../../utils/tenantDb');

// Categories
exports.getCategories = async (req, res) => {
    try {
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);
        const categories = await prisma.inventoryCategory.findMany();
        res.json({ success: true, data: categories });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch categories' });
    }
};

exports.addCategory = async (req, res) => {
    try {
        const { categoryName, description } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);
        const category = await prisma.inventoryCategory.create({
            data: { categoryName, description }
        });
        res.json({ success: true, data: category });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add category' });
    }
};

// Items
exports.getItems = async (req, res) => {
    try {
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);
        const items = await prisma.inventoryItem.findMany({
            include: { category: true }
        });
        res.json({ success: true, data: items });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch items' });
    }
};

exports.addItem = async (req, res) => {
    try {
        const { categoryId, itemName, itemCode, unit, quantity, minQuantity } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);
        const item = await prisma.inventoryItem.create({
            data: {
                categoryId,
                itemName,
                itemCode,
                unit,
                quantity: parseInt(quantity),
                minQuantity: minQuantity ? parseInt(minQuantity) : null
            }
        });
        res.json({ success: true, data: item });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to add item' });
    }
};

// Transactions (Stock In/Out)
exports.addTransaction = async (req, res) => {
    try {
        const { itemId, transactionType, quantity, reason } = req.body;
        const prisma = await tenantDb.getTenantClient(req.user.tenantId);

        const result = await prisma.$transaction(async (tx) => {
            // 1. Create Transaction Record
            const transaction = await tx.inventoryTransaction.create({
                data: {
                    itemId,
                    transactionType, // 'IN' or 'OUT'
                    quantity: parseInt(quantity),
                    reason,
                    performedBy: req.user.id
                }
            });

            // 2. Update Item Stock
            const operation = transactionType === 'IN' ? { increment: parseInt(quantity) } : { decrement: parseInt(quantity) };

            const updatedItem = await tx.inventoryItem.update({
                where: { id: itemId },
                data: { quantity: operation }
            });

            return { transaction, updatedItem };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Inventory Transaction Error:', error);
        res.status(500).json({ success: false, message: 'Failed to process transaction' });
    }
};
