const Transaction = require('../models/Transaction');
const TransactionService = require('../services/transactionService');
const { isValidObjectId } = require('../utils/validators'); // only this needed now

// ➕ Add Transaction (Admin only)
const addTransaction = async (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;

    // No manual validation — transactionValidation middleware handles it
    const transaction = await Transaction.create({
      amount: parseFloat(amount),
      type,
      category: category.trim(),
      description: description || '',
      date: date ? new Date(date) : Date.now(),
      user: req.user._id
    });

    res.status(201).json({
      success: true,
      message: 'Transaction added successfully',
      data: transaction
    });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// ➕ Bulk Create Transactions
const bulkCreateTransactions = async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'transactions must be a non-empty array'
      });
    }

    if (transactions.length > 100) {
      return res.status(400).json({
        success: false,
        code: 'LIMIT_EXCEEDED',
        message: 'Maximum 100 transactions allowed per bulk request'
      });
    }

    const result = await TransactionService.bulkCreate(transactions, req.user._id);

    res.status(result.error_count === 0 ? 201 : 207).json({
      success: true,
      message: result.error_count === 0
        ? 'All transactions created successfully'
        : 'Some transactions failed to create',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
};

// 🗑️ Bulk Delete Transactions
const bulkDeleteTransactions = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'ids must be a non-empty array'
      });
    }

    if (ids.length > 100) {
      return res.status(400).json({
        success: false,
        code: 'LIMIT_EXCEEDED',
        message: 'Maximum 100 ids allowed per bulk request'
      });
    }

    // Validate all ids
    const invalidIds = ids.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: `Invalid IDs found: ${invalidIds.join(', ')}`
      });
    }

    const result = await TransactionService.bulkDelete(ids);

    res.status(200).json({
      success: true,
      message: 'Bulk delete completed',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
};

// ✏️ Bulk Update Transactions
const bulkUpdateTransactions = async (req, res) => {
  try {
    const { ids, updates } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'ids must be a non-empty array'
      });
    }

    if (!updates || Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_INPUT',
        message: 'updates object is required'
      });
    }

    if (ids.length > 100) {
      return res.status(400).json({
        success: false,
        code: 'LIMIT_EXCEEDED',
        message: 'Maximum 100 ids allowed per bulk request'
      });
    }

    // Validate all ids
    const invalidIds = ids.filter(id => !isValidObjectId(id));
    if (invalidIds.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: `Invalid IDs found: ${invalidIds.join(', ')}`
      });
    }

    // Validate update fields
    const allowedFields = ['category', 'type', 'description'];
    const invalidFields = Object.keys(updates).filter(f => !allowedFields.includes(f));
    if (invalidFields.length > 0) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_FIELDS',
        message: `Cannot bulk update these fields: ${invalidFields.join(', ')}. Allowed: ${allowedFields.join(', ')}`
      });
    }

    if (updates.type && !['income', 'expense'].includes(updates.type)) {
      return res.status(422).json({
        success: false,
        code: 'VALIDATION_ERROR',
        message: 'Type must be income or expense'
      });
    }

    const result = await TransactionService.bulkUpdate(ids, updates);

    res.status(200).json({
      success: true,
      message: 'Bulk update completed',
      data: result
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message
    });
  }
};

// 📄 Get All Transactions
const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate, page = 1, limit = 5, search } = req.query;

    let filter = { isDeleted: { $ne: true } };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate && endDate) {
      filter.date = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }
    if (search) {
      filter.description = { $regex: search, $options: 'i' };
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      success: true,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transactions
    });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// 🔍 Get Single Transaction
const getTransactionById = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid transaction ID format'
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Transaction not found'
      });
    }

    if (req.user.role !== 'admin' && transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to view this transaction'
      });
    }

    res.status(200).json({ success: true, data: transaction });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// ✏️ Full Update (PUT)
const updateTransaction = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid transaction ID format'
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Transaction not found'
      });
    }

    if (req.user.role !== 'admin' && transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to update this transaction'
      });
    }

    const { amount, type, category, description, date } = req.body;

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      { amount, type, category, description, date },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: updatedTransaction
    });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// ✏️ Partial Update (PATCH)
const partialUpdateTransaction = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid transaction ID format'
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Transaction not found'
      });
    }

    if (req.user.role !== 'admin' && transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to update this transaction'
      });
    }

    const { amount, type, category, description, date } = req.body;

    if (amount !== undefined) transaction.amount = amount;
    if (type !== undefined) transaction.type = type;
    if (category !== undefined) transaction.category = category;
    if (description !== undefined) transaction.description = description;
    if (date !== undefined) transaction.date = date;

    const updatedTransaction = await transaction.save();

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: updatedTransaction
    });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// ❌ Delete Transaction (soft delete)
const deleteTransaction = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_ID',
        message: 'Invalid transaction ID format'
      });
    }

    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!transaction) {
      return res.status(404).json({
        success: false,
        code: 'NOT_FOUND',
        message: 'Transaction not found'
      });
    }

    if (req.user.role !== 'admin' && transaction.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to delete this transaction'
      });
    }

    transaction.isDeleted = true;
    transaction.deletedAt = new Date();
    await transaction.save();

    res.status(200).json({ success: true, message: 'Transaction deleted successfully' });

  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// 📊 Summary
const getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await TransactionService.getSummary(startDate, endDate);
    res.status(200).json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// 📊 Stats
const getStats = async (req, res) => {
  try {
    const stats = await TransactionService.getStats();
    res.status(200).json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// 📊 Weekly Trends
const getWeeklyTrends = async (req, res) => {
  try {
    const trends = await TransactionService.getWeeklyTrends();
    res.status(200).json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

// 📊 Top Categories
const getTopCategories = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const categories = await TransactionService.getTopCategories(limit);
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, code: 'SERVER_ERROR', message: error.message });
  }
};

module.exports = {
  addTransaction,
  bulkCreateTransactions,
  bulkDeleteTransactions,
  bulkUpdateTransactions,
  getTransactions,
  getTransactionById,
  updateTransaction,
  partialUpdateTransaction,
  deleteTransaction,
  getSummary,
  getStats,
  getWeeklyTrends,
  getTopCategories
};