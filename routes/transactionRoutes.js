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
  getStats
} = require('../controllers/transactionController');


// =======================
// 📊 STATIC ROUTES FIRST
// =======================

// Summary
router.get(
  '/summary',
  protect,
  authorizeRoles('analyst', 'admin'),
  getSummary
);

// Stats
router.get(
  '/stats',
  protect,
  authorizeRoles('analyst', 'admin'),
  getStats
);


// =======================
// 📄 COLLECTION ROUTES
// =======================

// Get all transactions
router.get(
  '/',
  protect,
  authorizeRoles('viewer', 'analyst', 'admin'),
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
// 🔍 PARAM ROUTES (LAST)
// =======================

// Get by ID
router.get(
  '/:id',
  protect,
  authorizeRoles('viewer', 'analyst', 'admin'),
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