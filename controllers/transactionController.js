const Transaction = require('../models/Transaction');

// ➕ Add transaction
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
      user: req.user.id // comes from protect middleware
    });

    res.status(201).json({
      message: "Transaction added successfully ✅",
      transaction
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get all transactions for logged-in user
// @route GET /api/transactions
const getTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });
    res.status(200).json({ transactions });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update a transaction
// @route PUT /api/transactions/:id
const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Make sure user owns the transaction
    if (transaction.user.toString() !== req.user.id) {
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

// @desc Get a transaction by ID
// @route GET /api/transactions/:id
const getTransactionById = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Make sure the transaction belongs to the logged-in user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    res.status(200).json(transaction);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Update a transaction by ID
// @route PATCH /api/transactions/:id
const partialUpdateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Make sure the transaction belongs to the logged-in user
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }
    // Update fields
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
// @desc Delete a transaction
// @route DELETE /api/transactions/:id
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);

    if (!transaction) {
      return res.status(404).json({ message: "Transaction not found" });
    }

    // Make sure user owns the transaction
    if (transaction.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await transaction.deleteOne();

    res.status(200).json({ message: "Transaction deleted successfully ✅" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Get dashboard summary
// @route GET /api/transactions/summary
const getSummary = async (req, res) => {
  try {
    const transactions = await Transaction.find({ user: req.user.id });

    const summary = transactions.reduce(
      (acc, curr) => {
        if (curr.type === "income") acc.totalIncome += curr.amount;
        if (curr.type === "expense") acc.totalExpenses += curr.amount;
        return acc;
      },
      { totalIncome: 0, totalExpenses: 0 }
    );

    summary.netBalance = summary.totalIncome - summary.totalExpenses;

    res.status(200).json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addTransaction,
  getTransactions,
  updateTransaction,
  deleteTransaction,
  getTransactionById,
  partialUpdateTransaction,
  getSummary
};