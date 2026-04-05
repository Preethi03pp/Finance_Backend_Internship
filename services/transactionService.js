const Transaction = require('../models/Transaction');

const getSummary = async () => {
  const totals = await Transaction.aggregate([
    {
      $group: {
        _id: '$type',
        total: { $sum: '$amount' }
      }
    }
  ]);

  let totalIncome = 0;
  let totalExpenses = 0;

  totals.forEach(t => {
    if (t._id === 'income') totalIncome = t.total;
    if (t._id === 'expense') totalExpenses = t.total;
  });

  const categoryData = await Transaction.aggregate([
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  const monthlyData = await Transaction.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        income: {
          $sum: {
            $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0]
          }
        },
        expenses: {
          $sum: {
            $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0]
          }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const recentTransactions = await Transaction.find()
    .sort({ date: -1 })
    .limit(5);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    categoryBreakdown: categoryData,
    monthlyTrends: monthlyData,
    recentTransactions
  };
};

const getStats = async () => {
  const stats = await Transaction.aggregate([
    { $match: { type: 'expense' } },
    {
      $group: {
        _id: null,
        highestExpense: { $max: '$amount' },
        lowestExpense: { $min: '$amount' },
        averageExpense: { $avg: '$amount' },
        totalExpenses: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    }
  ]);

  if (!stats.length) {
    return { message: 'No expense data available' };
  }

  const { highestExpense, lowestExpense, averageExpense, totalExpenses, count } = stats[0];

  return {
    highestExpense,
    lowestExpense,
    averageExpense: Math.round(averageExpense * 100) / 100,
    totalExpenses,
    count
  };
};

module.exports = { getSummary, getStats };