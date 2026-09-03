const Lead = require('../models/Lead');
const Customer = require('../models/Customer');
const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const Employee = require('../models/Employee');

// @desc    Get key dashboard statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getDashboardStats = async (req, res, next) => {
  try {
    const [
      leadsCount,
      customersCount,
      invoicesCount,
      ordersCount,
      employeesCount,
      revenueData
    ] = await Promise.all([
      Lead.countDocuments(),
      Customer.countDocuments({ isActive: true }),
      Invoice.countDocuments(),
      Order.countDocuments(),
      Employee.countDocuments({ isActive: true }),
      Invoice.aggregate([
        { $match: { status: { $in: ['paid', 'partial', 'unpaid', 'overdue'] } } }, // count all valid invoices for paid amount sum
        {
          $group: {
            _id: null,
            totalRevenue: { $sum: '$paidAmount' },
            totalExpected: { $sum: '$totalAmount' }
          }
        }
      ])
    ]);

    res.status(200).json({
      success: true,
      data: {
        leads: leadsCount,
        customers: customersCount,
        invoices: invoicesCount,
        orders: ordersCount,
        employees: employeesCount,
        revenue: revenueData[0] ? revenueData[0].totalRevenue : 0,
        expectedRevenue: revenueData[0] ? revenueData[0].totalExpected : 0,
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getDashboardStats };
