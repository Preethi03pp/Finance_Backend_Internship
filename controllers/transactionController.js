const Transaction = require('../models/Transaction');
const TransactionService = require('../services/transactionService');

// ➕ Add transaction (Admin only)
const addTransaction = async (req, res) => {
  try {
    const { amount, type, category, description, date } = req.body;

    if (!amount || !type || !category) {
      return res.status(400).json({
        message: "Amount, type, and category are required"
      });
    }

    const transaction = await Transaction.create({
      amount,
      type,
      category,
      description,
      date: date || Date.now(),
      user: req.user._id
    });

    res.status(201).json({
      message: "Transaction added successfully",
      transaction
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all transactions
const getTransactions = async (req, res) => {
  try {
    const {
      type,
      category,
      startDate,
      endDate,
      page = 1,
      limit = 5,
      search
    } = req.query;

    let filter = { isDeleted: { $ne: true } };

    if (type) filter.type = type;
    if (category) filter.category = category;

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (search) {
      filter.description = {
        $regex: search,
        $options: 'i'
      };
    }

    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ date: -1 });

    const total = await Transaction.countDocuments(filter);

    res.status(200).json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: transactions
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get single transaction
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (
      req.user.role !== 'admin' &&
      transaction.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(transaction);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Full update (PUT)
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (
      req.user.role !== 'admin' &&
      transaction.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      {
        amount: req.body.amount,
        type: req.body.type,
        category: req.body.category,
        description: req.body.description,
        date: req.body.date
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Transaction updated successfully",
      updatedTransaction
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Partial update (PATCH)
const partialUpdateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (
      req.user.role !== 'admin' &&
      transaction.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { amount, type, category, description, date } = req.body;

    if (amount !== undefined) transaction.amount = amount;
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (description) transaction.description = description;
    if (date) transaction.date = date;

    const updatedTransaction = await transaction.save();

    res.status(200).json({
      message: "Transaction updated successfully",
      transaction: updatedTransaction
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete transaction (soft delete)
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({
      _id: req.params.id,
      isDeleted: { $ne: true }
    });

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (
      req.user.role !== 'admin' &&
      transaction.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    transaction.isDeleted = true;
    transaction.deletedAt = new Date();
    await transaction.save();

    res.status(200).json({
      message: "Transaction deleted successfully"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📊 Summary API — now uses service + supports date filter
const getSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const summary = await TransactionService.getSummary(startDate, endDate);
    res.status(200).json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📊 Stats API
const getStats = async (req, res) => {
  try {
    const stats = await TransactionService.getStats();
    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📊 Weekly Trends API
const getWeeklyTrends = async (req, res) => {
  try {
    const trends = await TransactionService.getWeeklyTrends();
    res.status(200).json(trends);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📊 Top Categories API
const getTopCategories = async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;
    const categories = await TransactionService.getTopCategories(limit);
    res.status(200).json(categories);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addTransaction,
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