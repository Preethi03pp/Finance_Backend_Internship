const express = require('express');
const router = express.Router();

const { protect, authorizeRoles } = require('../middleware/authMiddleware');
const validate = require('../middleware/validate');

const {
  transactionValidation,
  partialTransactionValidation
} = require('../validators/transactionValidator');

const {
  addTransaction,
  getTransactions,
  getTransactionById,
  partialUpdateTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary,
  getStats,
  getWeeklyTrends,
  getTopCategories
} = require('../controllers/transactionController');


// =======================
// STATIC ROUTES FIRST
// =======================
// Summary
router.get(
  '/summary',
  protect,
  authorizeRoles('viewer', 'analyst', 'admin'),
  getSummary
);

// Stats
router.get(
  '/stats',
  protect,
  authorizeRoles('viewer', 'analyst', 'admin'),
  getStats
);

// Weekly Trends
router.get(
  '/weekly-trends',
  protect,
  authorizeRoles('viewer', 'analyst', 'admin'),
  getWeeklyTrends
);

// Top Categories
router.get(
  '/top-categories',
  protect,
  authorizeRoles('viewer', 'analyst', 'admin'),
  getTopCategories
);

// =======================
// COLLECTION ROUTES
// =======================

// Get all transactions
router.get(
  '/',
  protect,
  authorizeRoles('analyst', 'admin'),
  getTransactions
);

// Create transaction
router.post(
  '/',
  protect,
  authorizeRoles('admin'),
  transactionValidation,
  validate,
  addTransaction
);


// =======================
// PARAM ROUTES (LAST)
// =======================

// Get by ID
router.get(
  '/:id',
  protect,
  authorizeRoles('analyst', 'admin'),
  getTransactionById
);

// Update (PUT)
router.put(
  '/:id',
  protect,
  authorizeRoles('admin'),
  transactionValidation,
  validate,
  updateTransaction
);

// Partial Update (PATCH)
router.patch(
  '/:id',
  protect,
  authorizeRoles('admin'),
  partialTransactionValidation,
  validate,
  partialUpdateTransaction
);

// Delete
router.delete(
  '/:id',
  protect,
  authorizeRoles('admin'),
  deleteTransaction
);

module.exports = router;