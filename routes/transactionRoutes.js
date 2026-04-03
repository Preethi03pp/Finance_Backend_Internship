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

// ✅ CREATE (with validation)
router.post(
  '/',
  protect,
  authorizeRoles('admin'),
  transactionValidation,
  validate,
  addTransaction
);

// ✅ PATCH (partial validation)
router.patch(
  '/:id',
  protect,
  authorizeRoles('admin'),
  partialTransactionValidation,
  validate,
  partialUpdateTransaction
);

// ✅ PUT (full validation)
router.put(
  '/:id',
  protect,
  authorizeRoles('admin'),
  transactionValidation,
  validate,
  updateTransaction
);

// ❌ DELETE
router.delete(
  '/:id',
  protect,
  authorizeRoles('admin'),
  deleteTransaction
);

// 📊 SUMMARY
router.get(
  '/summary',
  protect,
  authorizeRoles('analyst', 'admin'),
  getSummary
);

// 📄 GET ALL
router.get(
  '/',
  protect,
  authorizeRoles('viewer', 'analyst', 'admin'),
  getTransactions
);

router.get(
  '/stats',
  protect,
  authorizeRoles('analyst', 'admin'),
  getStats
);

// 🔍 GET BY ID
router.get(
  '/:id',
  protect,
  authorizeRoles('viewer', 'analyst', 'admin'),
  getTransactionById
);

module.exports = router;