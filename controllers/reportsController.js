const Invoice = require('../models/Invoice');
const Expense = require('../models/Purchase');
const Lead = require('../models/Lead');

// @desc    Get sales report grouped by month
// @route   GET /api/reports/sales
// @access  Private
const getSalesReport = async (req, res, next) => {
  try {
    // This groups valid invoices by month based on createdAt
    const sales = await Invoice.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          totalSales: { $sum: '$totalAmount' },
          totalPaid: { $sum: '$paidAmount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.status(200).json({
      success: true,
      data: sales.map(item => ({
        month: `${item._id.year}-${String(item._id.month).padStart(2, '0')}`,
        totalSales: item.totalSales,
        totalPaid: item.totalPaid,
        invoicesCount: item.count
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get expenses report grouped by category
// @route   GET /api/reports/expenses
// @access  Private
const getExpensesReport = async (req, res, next) => {
  try {
    const expenses = await Expense.aggregate([
      { $match: { status: { $ne: 'rejected' } } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { totalAmount: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: expenses.map(item => ({
        category: item._id,
        totalAmount: item.totalAmount,
        count: item.count
      }))
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get leads report grouped by status
// @route   GET /api/reports/leads
// @access  Private
const getLeadsReport = async (req, res, next) => {
  try {
    const leads = await Lead.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.status(200).json({
      success: true,
      data: leads.map(item => ({
        status: item._id,
        count: item.count
      }))
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getSalesReport, getExpensesReport, getLeadsReport };
