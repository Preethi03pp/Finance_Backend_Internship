const { body } = require('express-validator');

const transactionValidation = [
  body('amount')
    .notEmpty().withMessage('Amount is required')
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),

  body('type')
    .notEmpty().withMessage('Type is required')
    .isIn(['income', 'expense']).withMessage('Type must be income or expense'),

  body('category')
    .notEmpty().withMessage('Category is required')   // ← was .optional()
    .isString().withMessage('Category must be a string')
    .trim(),

  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),

  body('date')
    .optional()                                        // ← was missing entirely
    .isISO8601().withMessage('Invalid date format. Use ISO format e.g. 2024-01-15'),
];

const partialTransactionValidation = [
  body('amount')
    .optional()
    .isFloat({ gt: 0 }).withMessage('Amount must be greater than 0'),

  body('type')
    .optional()
    .isIn(['income', 'expense']).withMessage('Type must be income or expense'),

  body('category')
    .optional()
    .isString().withMessage('Category must be a string')
    .trim(),

  body('description')
    .optional()
    .isString().withMessage('Description must be a string')
    .isLength({ max: 200 }).withMessage('Description cannot exceed 200 characters'),

  body('date')
    .optional()                                        // ← was missing here too
    .isISO8601().withMessage('Invalid date format. Use ISO format e.g. 2024-01-15'),
];

module.exports = { transactionValidation, partialTransactionValidation };