const { body } = require('express-validator');

const transactionValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['income', 'expense']).withMessage('Invalid type'),

  body('category')
    .optional()
    .isString().withMessage('Category must be string'),

  body('description')
    .optional()
    .isLength({ max: 200 }).withMessage('Max 200 characters')
];

const partialTransactionValidation = [
  body('amount').optional().isFloat({ gt: 0 }),
  body('type').optional().isIn(['income', 'expense']),
  body('category').optional().isString(),
  body('description').optional().isLength({ max: 200 })
];

module.exports = {
  transactionValidation,
  partialTransactionValidation
};