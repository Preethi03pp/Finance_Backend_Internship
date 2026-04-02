const express = require('express');
const router = express.Router();
const { protect, authorizeRoles } = require('../middleware/authMiddleware');

const {
  addTransaction,
  getTransactions,
  getTransactionById,
  partialUpdateTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
} = require('../controllers/transactionController');

router.post('/', protect, authorizeRoles('admin'), addTransaction);
router.patch('/:id', protect, authorizeRoles('admin'), partialUpdateTransaction); 
router.put('/:id', protect, authorizeRoles('admin'), updateTransaction);
router.delete('/:id', protect, authorizeRoles('admin'), deleteTransaction);
router.get('/summary', protect, authorizeRoles('analyst', 'admin'), getSummary);
router.get('/', protect, authorizeRoles('viewer', 'analyst', 'admin'), getTransactions);
router.get('/:id', protect, authorizeRoles('viewer', 'analyst', 'admin'), getTransactionById); 


module.exports = router;