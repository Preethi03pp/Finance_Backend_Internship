const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    amount: {
      type: Number,
      required: true
    },
    type: {
      type: String,
      enum: ['income', 'expense'],
      required: true
    },
    category: {
      type: String,
      required: true
    },
    description: {
      type: String,
      default: ''
    },
    date: {
      type: Date,
      required: true,
      default: Date.now
    },
    isDeleted: {
      type: Boolean,
      default: false
    },
    deletedAt: {
      type: Date,
      default: null
    }
  },
  { timestamps: true }
);


// =======================
// INDEXES (PERFORMANCE)
// =======================
transactionSchema.index({ user: 1 });
transactionSchema.index({ category: 1 });
transactionSchema.index({ date: -1 });
transactionSchema.index({ type: 1 });

module.exports = mongoose.model('Transaction', transactionSchema);