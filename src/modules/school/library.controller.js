const { getTenantPrismaClient } = require('../../utils/tenantDb');

const getAllBooks = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { limit = 50, offset = 0, search } = req.query;

        const where = {};
        if (search) {
            where.OR = [
                { bookTitle: { contains: search, mode: 'insensitive' } },
                { author: { contains: search, mode: 'insensitive' } },
                { isbn: { contains: search, mode: 'insensitive' } }
            ];
        }

        const [books, total] = await Promise.all([
            tenantDb.libraryBook.findMany({
                where,
                orderBy: { bookTitle: 'asc' },
                take: parseInt(limit),
                skip: parseInt(offset)
            }),
            tenantDb.libraryBook.count({ where })
        ]);

        res.json({
            success: true,
            data: {
                books,
                pagination: {
                    total,
                    count: books.length,
                    limit: parseInt(limit),
                    offset: parseInt(offset),
                    hasMore: (parseInt(offset) + parseInt(limit)) < total
                }
            }
        });
    } catch (error) {
        console.error('Get books error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch books' });
    }
};

const issueBook = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { bookId, studentId, dueDate } = req.body;

        const book = await tenantDb.libraryBook.findUnique({ where: { id: bookId } });

        if (book.available <= 0) {
            return res.status(400).json({ success: false, message: 'Book not available' });
        }

        const transaction = await tenantDb.libraryTransaction.create({
            data: {
                bookId,
                studentId,
                dueDate: new Date(dueDate),
                status: 'ISSUED',
            },
        });

        await tenantDb.libraryBook.update({
            where: { id: bookId },
            data: { available: book.available - 1 },
        });

        res.status(201).json({ success: true, data: { transaction } });
    } catch (error) {
        console.error('Issue book error:', error);
        res.status(500).json({ success: false, message: 'Failed to issue book' });
    }
};

const returnBook = async (req, res) => {
    try {
        const { id } = req.params;
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const transaction = await tenantDb.libraryTransaction.findUnique({
            where: { id },
            include: { book: true },
        });

        await tenantDb.libraryTransaction.update({
            where: { id },
            data: {
                returnDate: new Date(),
                status: 'RETURNED',
            },
        });

        await tenantDb.libraryBook.update({
            where: { id: transaction.bookId },
            data: { available: transaction.book.available + 1 },
        });

        res.json({ success: true, message: 'Book returned successfully' });
    } catch (error) {
        console.error('Return book error:', error);
        res.status(500).json({ success: false, message: 'Failed to return book' });
    }
};



const createBook = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { bookTitle, author, isbn, category, publisher, quantity } = req.body;

        const book = await tenantDb.libraryBook.create({
            data: {
                bookTitle,
                author,
                isbn,
                category,
                publisher,
                quantity: parseInt(quantity) || 1,
                available: parseInt(quantity) || 1,
            }
        });

        res.status(201).json({ success: true, data: { book }, message: 'Book added successfully' });
    } catch (error) {
        console.error('createBook error:', error);
        res.status(500).json({ success: false, message: 'Failed to create book' });
    }
};

const updateBook = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { id } = req.params;
        const { bookTitle, author, isbn, category, publisher, quantity } = req.body;

        const book = await tenantDb.libraryBook.update({
            where: { id },
            data: {
                ...(bookTitle && { bookTitle }),
                ...(author && { author }),
                ...(isbn !== undefined && { isbn }),
                ...(category && { category }),
                ...(publisher !== undefined && { publisher }),
                ...(quantity && { quantity: parseInt(quantity), available: parseInt(quantity) }),
            }
        });

        res.json({ success: true, data: { book }, message: 'Book updated successfully' });
    } catch (error) {
        console.error('updateBook error:', error);
        res.status(500).json({ success: false, message: 'Failed to update book' });
    }
};

const deleteBook = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { id } = req.params;

        // Check if book has active transactions
        const activeTransactions = await tenantDb.libraryTransaction.count({
            where: { bookId: id, status: 'ISSUED' }
        });

        if (activeTransactions > 0) {
            return res.status(400).json({
                success: false,
                message: 'Cannot delete book with active issues'
            });
        }

        await tenantDb.libraryBook.delete({ where: { id } });

        res.json({ success: true, message: 'Book deleted successfully' });
    } catch (error) {
        console.error('deleteBook error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete book' });
    }
};

const renewBook = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { id } = req.params;
        const { newDueDate } = req.body;

        const transaction = await tenantDb.libraryTransaction.findUnique({ where: { id } });

        if (!transaction || transaction.status !== 'ISSUED') {
            return res.status(400).json({
                success: false,
                message: 'Transaction not found or already returned'
            });
        }

        const updated = await tenantDb.libraryTransaction.update({
            where: { id },
            data: { dueDate: new Date(newDueDate) }
        });

        res.json({ success: true, data: { transaction: updated }, message: 'Book renewed successfully' });
    } catch (error) {
        console.error('renewBook error:', error);
        res.status(500).json({ success: false, message: 'Failed to renew book' });
    }
};

const reserveBook = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { bookId, studentId } = req.body;

        // Check if book is available
        const book = await tenantDb.libraryBook.findUnique({ where: { id: bookId } });

        if (!book) {
            return res.status(404).json({ success: false, message: 'Book not found' });
        }

        if (book.available <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Book not available for reservation'
            });
        }

        // Note: In a full implementation, you'd have a Reservation table
        // For now, we'll return success with a message
        res.json({
            success: true,
            message: 'Book reservation feature - would create reservation record',
            data: { bookId, studentId, bookTitle: book.bookTitle }
        });
    } catch (error) {
        console.error('reserveBook error:', error);
        res.status(500).json({ success: false, message: 'Failed to reserve book' });
    }
};

const getOverdueBooks = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const overdueTransactions = await tenantDb.libraryTransaction.findMany({
            where: {
                status: 'ISSUED',
                dueDate: { lt: new Date() }
            },
            include: {
                book: { select: { bookTitle: true, author: true } },
                student: {
                    include: {
                        user: { select: { fullName: true, phone: true } },
                        class: { select: { className: true, section: true } }
                    }
                }
            },
            orderBy: { dueDate: 'asc' }
        });

        res.json({ success: true, data: { overdueBooks: overdueTransactions } });
    } catch (error) {
        console.error('getOverdueBooks error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch overdue books' });
    }
};

const getStudentHistory = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);
        const { studentId } = req.params;

        const history = await tenantDb.libraryTransaction.findMany({
            where: { studentId },
            include: {
                book: { select: { bookTitle: true, author: true } }
            },
            orderBy: { issueDate: 'desc' }
        });

        res.json({ success: true, data: { history } });
    } catch (error) {
        console.error('getStudentHistory error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch student history' });
    }
};

const getLibraryStats = async (req, res) => {
    try {
        const { tenantId } = req.user;
        const tenantDb = getTenantPrismaClient(tenantId);

        const [totalBooks, totalIssued, totalOverdue, totalAvailable] = await Promise.all([
            tenantDb.libraryBook.aggregate({ _sum: { quantity: true } }),
            tenantDb.libraryTransaction.count({ where: { status: 'ISSUED' } }),
            tenantDb.libraryTransaction.count({
                where: {
                    status: 'ISSUED',
                    dueDate: { lt: new Date() }
                }
            }),
            tenantDb.libraryBook.aggregate({ _sum: { available: true } })
        ]);

        res.json({
            success: true,
            data: {
                totalBooks: totalBooks._sum.quantity || 0,
                totalIssued,
                totalOverdue,
                totalAvailable: totalAvailable._sum.available || 0
            }
        });
    } catch (error) {
        console.error('getLibraryStats error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch library stats' });
    }
};
module.exports = {
    getAllBooks,
    issueBook,
    returnBook,
    createBook,
    updateBook,
    deleteBook,
    renewBook,
    reserveBook,
    getOverdueBooks,
    getStudentHistory,
    getLibraryStats,
};
