const Invoice = require('../models/Invoice');
const Purchase = require('../models/Purchase');
const Lead = require('../models/Lead');

// ============================================================
// SALES REPORT
// GET /api/reports/sales
// ============================================================

const getSalesReport = async (req, res, next) => {
  try {
    const sales = await Invoice.aggregate([
      {
        $match: {
          status: {
            $ne: 'cancelled',
          },
        },
      },

      {
        $group: {
          _id: {
            year: {
              $year: '$createdAt',
            },
            month: {
              $month: '$createdAt',
            },
          },

          totalSales: {
            $sum: '$totalAmount',
          },

          totalPaid: {
            $sum: '$paidAmount',
          },

          invoiceCount: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          '_id.year': 1,
          '_id.month': 1,
        },
      },
    ]);

    const data = sales.map((item) => ({
      month: `${item._id.year}-${String(
        item._id.month
      ).padStart(2, '0')}`,

      totalSales: Number(item.totalSales || 0),

      totalPaid: Number(item.totalPaid || 0),

      invoiceCount: Number(
        item.invoiceCount || 0
      ),
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// PURCHASE / EXPENSE REPORT
// GET /api/reports/purchases
// ============================================================

const getExpensesReport = async (req, res, next) => {
  try {
    const expenses = await Purchase.aggregate([
      {
        $match: {
          status: {
            $ne: 'rejected',
          },
        },
      },

      {
        $group: {
          _id: '$category',

          totalAmount: {
            $sum: '$amount',
          },

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          totalAmount: -1,
        },
      },
    ]);

    const data = expenses.map((item) => ({
      category:
        item._id || 'Uncategorized',

      totalAmount: Number(
        item.totalAmount || 0
      ),

      count: Number(item.count || 0),
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// LEADS REPORT
// GET /api/reports/leads
// ============================================================

const getLeadsReport = async (req, res, next) => {
  try {
    const leads = await Lead.aggregate([
      {
        $group: {
          _id: '$status',

          count: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          count: -1,
        },
      },
    ]);

    const data = leads.map((item) => ({
      status:
        item._id || 'unknown',

      count: Number(
        item.count || 0
      ),
    }));

    res.status(200).json({
      success: true,
      data,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  getSalesReport,
  getExpensesReport,
  getLeadsReport,
};