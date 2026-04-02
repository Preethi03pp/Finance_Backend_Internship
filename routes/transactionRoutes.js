const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');

const {
  addTransaction,
  getTransactions,
  getTransactionById,
  partialUpdateTransaction,
  updateTransaction,
  deleteTransaction,
  getSummary
} = require('../controllers/transactionController');

router.post('/', protect, addTransaction);
router.get('/', protect, getTransactions);
router.get('/:id', protect, getTransactionById); 
router.patch('/:id', protect, partialUpdateTransaction); 
router.put('/:id', protect, updateTransaction);
router.delete('/:id', protect, deleteTransaction);
router.get('/summary', protect, getSummary);

module.exports = router;