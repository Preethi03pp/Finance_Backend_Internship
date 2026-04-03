const Transaction = require('../models/Transaction');


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
      user: req.user._id // ✅ FIXED
    });

    res.status(201).json({
      message: "Transaction added successfully ✅",
      transaction
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📄 Get all transactions
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

    let filter = {};

    // 🔒 Restrict non-admin users
    if (req.user.role !== 'admin') {
      filter.user = req.user._id; // ✅ FIXED
    }

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
      .sort({ date: -1 }); // ✅ better than createdAt

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


// 🔍 Get single transaction
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" }); // ✅ FIXED
    }

    if (
      req.user.role !== 'admin' &&
      transaction.user.toString() !== req.user._id.toString() // ✅ FIXED
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(transaction);

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✏️ Full update (PUT)
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

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
      message: "Transaction updated successfully ✅",
      updatedTransaction
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ✏️ Partial update (PATCH)
const partialUpdateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

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
      message: "Transaction updated successfully ✅",
      transaction: updatedTransaction
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// ❌ Delete transaction
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    if (
      req.user.role !== 'admin' &&
      transaction.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await transaction.deleteOne();

    res.status(200).json({
      message: "Transaction deleted successfully ✅"
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📊 Summary API
const getSummary = async (req, res) => {
  try {
    let match = {};

    if (req.user.role !== 'admin') {
      match.user = req.user._id; // ✅ consistent
    }

    const totals = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$type",
          total: { $sum: "$amount" }
        }
      }
    ]);

    let totalIncome = 0;
    let totalExpenses = 0;

    totals.forEach(t => {
      if (t._id === "income") totalIncome = t.total;
      if (t._id === "expense") totalExpenses = t.total;
    });

    const categoryData = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      }
    ]);

    const monthlyData = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: {
            year: { $year: "$date" },
            month: { $month: "$date" }
          },
          total: { $sum: "$amount" }
        }
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const recentTransactions = await Transaction.find(match)
      .sort({ date: -1 })
      .limit(5);

    res.status(200).json({
      totalIncome,
      totalExpenses,
      netBalance: totalIncome - totalExpenses,
      categoryBreakdown: categoryData,
      monthlyTrends: monthlyData,
      recentTransactions
    });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// 📊 Stats API
const getStats = async (req, res) => {
  try {
    let match = {};

    if (req.user.role !== 'admin') {
      match.user = req.user._id; // ✅ FIXED
    }

    const transactions = await Transaction.find(match);

    const expenses = transactions.filter(t => t.type === "expense");

    if (expenses.length === 0) {
      return res.status(200).json({
        message: "No expense data available"
      });
    }

    const amounts = expenses.map(e => e.amount);

    const stats = {
      highestExpense: Math.max(...amounts),
      lowestExpense: Math.min(...amounts),
      averageExpense:
        amounts.reduce((a, b) => a + b, 0) / amounts.length
    };

    res.status(200).json(stats);

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
  getStats
};