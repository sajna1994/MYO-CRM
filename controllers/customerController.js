const Customer = require('../models/Customer');

// @desc    Get all customers (with pagination, search)
// @route   GET /api/customers
// @access  Private
const getCustomers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: 'i' } },
        { email: { $regex: req.query.search, $options: 'i' } },
        { company: { $regex: req.query.search, $options: 'i' } },
      ];
    }
    if (req.query.company) filter.company = { $regex: req.query.company, $options: 'i' };

    const [customers, total] = await Promise.all([
      Customer.find(filter).skip(skip).limit(limit).sort('-createdAt'),
      Customer.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: customers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: customers,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single customer
// @route   GET /api/customers/:id
// @access  Private
const getCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Create customer
// @route   POST /api/customers
// @access  Private
const createCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.create(req.body);
    res.status(201).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Update customer
// @route   PUT /api/customers/:id
// @access  Private
const updateCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, data: customer });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete customer
// @route   DELETE /api/customers/:id
// @access  Private
const deleteCustomer = async (req, res, next) => {
  try {
    const customer = await Customer.findByIdAndDelete(req.params.id);

    if (!customer) {
      return res.status(404).json({ success: false, message: 'Customer not found' });
    }

    res.status(200).json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getCustomers, getCustomer, createCustomer, updateCustomer, deleteCustomer };
