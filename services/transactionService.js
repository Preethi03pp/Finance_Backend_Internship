const Transaction = require('../models/Transaction');

const getSummary = async (startDate, endDate) => {
  let dateFilter = { isDeleted: false };

  if (startDate && endDate) {
    dateFilter.date = {
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    };
  }

  const totals = await Transaction.aggregate([
    { $match: dateFilter },
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
    { $match: dateFilter },
    {
      $group: {
        _id: { category: '$category', type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } }
  ]);

  // format category data — income vs expense side by side
  const categoryMap = {};
  categoryData.forEach(item => {
    const cat = item._id.category;
    if (!categoryMap[cat]) {
      categoryMap[cat] = { category: cat, income: 0, expense: 0, count: 0 };
    }
    categoryMap[cat][item._id.type] += item.total;
    categoryMap[cat].count += item.count;
  });
  const categoryBreakdown = Object.values(categoryMap)
    .sort((a, b) => (b.income + b.expense) - (a.income + a.expense));

  const monthlyData = await Transaction.aggregate([
    { $match: dateFilter },
    {
      $group: {
        _id: {
          year: { $year: '$date' },
          month: { $month: '$date' }
        },
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
        },
        expenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
        }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  const weeklyData = await Transaction.aggregate([
    {
      $match: {
        ...dateFilter,
        date: {
          $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000)
        }
      }
    },
    {
      $group: {
        _id: { $dayOfWeek: '$date' },
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
        },
        expenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const weeklyTrends = weeklyData.map(d => ({
    day: days[d._id - 1],
    income: d.income,
    expenses: d.expenses,
    count: d.count
  }));

  const recentTransactions = await Transaction.find({ isDeleted: false })
    .sort({ date: -1 })
    .limit(5);

  // top spending categories
  const topSpending = categoryBreakdown
    .filter(c => c.expense > 0)
    .sort((a, b) => b.expense - a.expense)
    .slice(0, 5);

  // financial health indicators
  const incomeToExpenseRatio = totalExpenses > 0
    ? Math.round((totalIncome / totalExpenses) * 100) / 100
    : 0;

  const totalTransactions = await Transaction.countDocuments({ isDeleted: false });
  const dailyAvgSpending = totalExpenses > 0 && totalTransactions > 0
    ? Math.round((totalExpenses / 30) * 100) / 100
    : 0;

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    incomeToExpenseRatio,
    dailyAverageSpending: dailyAvgSpending,
    categoryBreakdown,
    topSpendingCategories: topSpending,
    monthlyTrends: monthlyData,
    weeklyTrends,
    recentTransactions
  };
};

const getStats = async () => {
  const stats = await Transaction.aggregate([
    { $match: { type: 'expense', isDeleted: false } },
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

const getWeeklyTrends = async () => {
  const weeklyData = await Transaction.aggregate([
    {
      $match: {
        isDeleted: false,
        date: { $gte: new Date(new Date() - 7 * 24 * 60 * 60 * 1000) }
      }
    },
    {
      $group: {
        _id: { $dayOfWeek: '$date' },
        income: {
          $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', 0] }
        },
        expenses: {
          $sum: { $cond: [{ $eq: ['$type', 'expense'] }, '$amount', 0] }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id': 1 } }
  ]);

  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return weeklyData.map(d => ({
    day: days[d._id - 1],
    income: d.income,
    expenses: d.expenses,
    count: d.count
  }));
};

const getTopCategories = async (limit = 5) => {
  const data = await Transaction.aggregate([
    { $match: { isDeleted: false, type: 'expense' } },
    {
      $group: {
        _id: '$category',
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }
    },
    { $sort: { total: -1 } },
    { $limit: limit }
  ]);

  return data.map(d => ({
    category: d._id,
    totalSpent: d.total,
    transactionCount: d.count
  }));
};

module.exports = { getSummary, getStats, getWeeklyTrends, getTopCategories };