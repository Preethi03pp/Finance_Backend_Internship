const Transaction = require('../models/Transaction');

// ➕ Add transaction (Admin only)
const addTransaction = async (req, res) => {
  try {
    const { amount, type, category, description } = req.body;

    if (!amount || !type) {
      return res.status(400).json({
        message: "Amount and type are required"
      });
    }

    const transaction = await Transaction.create({
      amount,
      type,
      category,
      description,
      user: req.user.id
    });

    res.status(201).json({
      message: "Transaction added successfully ✅",
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// 📄 Get all transactions (with filtering, search, pagination)
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

    // 🔒 Restrict non-admin users to their own data
    if (req.user.role !== 'admin') {
      filter.user = req.user.id;
    }

    // 🔍 Filtering
    if (type) filter.type = type;
    if (category) filter.category = category;

    if (startDate && endDate) {
      filter.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    // 🔍 Search
    if (search) {
      filter.description = {
        $regex: search,
        $options: 'i'
      };
    }

    // 📄 Pagination
    const skip = (page - 1) * limit;

    const transactions = await Transaction.find(filter)
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

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
  res.status(404);
  throw new Error("Transaction not found");
}

    // 🔒 Role-based ownership check
    if (
      req.user.role !== 'admin' &&
      transaction.user.toString() !== req.user.id
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
  res.status(404);
  throw new Error("Transaction not found");
}

    // 🔒 Role-based ownership check
    if (
      req.user.role !== 'admin' &&
      transaction.user.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      req.params.id,
      req.body,
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
  res.status(404);
  throw new Error("Transaction not found");
}

    // 🔒 Role-based ownership check
    if (
      req.user.role !== 'admin' &&
      transaction.user.toString() !== req.user.id
    ) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const { amount, type, category, description } = req.body;

    if (amount !== undefined) transaction.amount = amount;
    if (type) transaction.type = type;
    if (category) transaction.category = category;
    if (description) transaction.description = description;

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
  res.status(404);
  throw new Error("Transaction not found");
}

    // 🔒 Role-based ownership check
    if (
      req.user.role !== 'admin' &&
      transaction.user.toString() !== req.user.id
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

    // 🔒 Restrict non-admin users
    if (req.user.role !== 'admin') {
      match.user = req.user._id;
    }

    // 1️⃣ Total Income & Expense
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

    // 2️⃣ Category-wise totals
    const categoryData = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$category",
          total: { $sum: "$amount" }
        }
      }
    ]);

    // 3️⃣ Monthly trends
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

    // 4️⃣ Recent transactions
    const recentTransactions = await Transaction.find(match)
      .sort({ createdAt: -1 })
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

    // 🔒 Restrict non-admin users
    if (req.user.role !== 'admin') {
      match.user = req.user.id;
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
    res.status(500);
    throw new Error(error.message);
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