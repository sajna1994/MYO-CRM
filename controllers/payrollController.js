const Payroll = require('../models/Payroll');
const Employee = require('../models/Employee');

// @desc    Get all payroll records (paginated, filterable)
// @route   GET /api/payroll
const getPayrolls = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.month) filter.month = parseInt(req.query.month, 10);
    if (req.query.year) filter.year = parseInt(req.query.year, 10);
    if (req.query.status) filter.status = req.query.status;
    if (req.query.employee) filter.employee = req.query.employee;

    const [payrolls, total] = await Promise.all([
      Payroll.find(filter)
        .populate('employee', 'name email department position')
        .skip(skip)
        .limit(limit)
        .sort('-year -month'),
      Payroll.countDocuments(filter),
    ]);

    // Calculate summary
    const summary = await Payroll.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalBaseSalary: { $sum: '$baseSalary' },
          totalDeductions: { $sum: '$deductions' },
          totalNetPay: { $sum: '$netPay' },
          totalBonus: { $sum: '$bonus' },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      count: payrolls.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      summary: summary[0] || { totalBaseSalary: 0, totalDeductions: 0, totalNetPay: 0, totalBonus: 0 },
      data: payrolls,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payroll record
// @route   GET /api/payroll/:id
const getPayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findById(req.params.id).populate(
      'employee',
      'name email department position salary'
    );
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });
    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
};

// @desc    Create payroll record
// @route   POST /api/payroll
const createPayroll = async (req, res, next) => {
  try {
    // Auto-calculate netPay if not provided
    if (req.body.baseSalary !== undefined && req.body.netPay === undefined) {
      const allowances = req.body.allowances || 0;
      const bonus = req.body.bonus || 0;
      const deductions = req.body.deductions || 0;
      const tax = req.body.tax || 0;
      req.body.netPay = req.body.baseSalary + allowances + bonus - deductions - tax;
    }

    // Auto-fill baseSalary from employee if not provided
    if (!req.body.baseSalary && req.body.employee) {
      const employee = await Employee.findById(req.body.employee);
      if (employee) {
        req.body.baseSalary = employee.salary;
        if (req.body.netPay === undefined) {
          const allowances = req.body.allowances || 0;
          const bonus = req.body.bonus || 0;
          const deductions = req.body.deductions || 0;
          const tax = req.body.tax || 0;
          req.body.netPay = employee.salary + allowances + bonus - deductions - tax;
        }
      }
    }

    const payroll = await Payroll.create(req.body);
    const populated = await payroll.populate('employee', 'name email department');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payroll record
// @route   PUT /api/payroll/:id
const updatePayroll = async (req, res, next) => {
  try {
    // Recalculate netPay if salary components change
    if (req.body.baseSalary !== undefined) {
      const allowances = req.body.allowances || 0;
      const bonus = req.body.bonus || 0;
      const deductions = req.body.deductions || 0;
      const tax = req.body.tax || 0;
      req.body.netPay = req.body.baseSalary + allowances + bonus - deductions - tax;
    }

    const payroll = await Payroll.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('employee', 'name email department');

    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });
    res.status(200).json({ success: true, data: payroll });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payroll record
// @route   DELETE /api/payroll/:id
const deletePayroll = async (req, res, next) => {
  try {
    const payroll = await Payroll.findByIdAndDelete(req.params.id);
    if (!payroll) return res.status(404).json({ success: false, message: 'Payroll record not found' });
    res.status(200).json({ success: true, message: 'Payroll record deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// @desc    Generate payroll for all active employees for a given month/year
// @route   POST /api/payroll/generate
const generatePayroll = async (req, res, next) => {
  try {
    const { month, year } = req.body;

    if (!month || !year) {
      return res.status(400).json({ success: false, message: 'Month and year are required' });
    }

    const activeEmployees = await Employee.find({ isActive: true });
    const created = [];
    const skipped = [];

    for (const emp of activeEmployees) {
      // Check if payroll already exists
      const exists = await Payroll.findOne({ employee: emp._id, month, year });
      if (exists) {
        skipped.push(emp.name);
        continue;
      }

      const payroll = await Payroll.create({
        employee: emp._id,
        month,
        year,
        baseSalary: emp.salary,
        netPay: emp.salary,
      });
      created.push(payroll);
    }

    res.status(201).json({
      success: true,
      message: `Generated ${created.length} payroll records, skipped ${skipped.length} (already exist)`,
      created: created.length,
      skipped,
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPayrolls, getPayroll, createPayroll, updatePayroll, deletePayroll, generatePayroll };
