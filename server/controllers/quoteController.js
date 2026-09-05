const Quote = require('../models/Quote');

// @desc    Get all quotes (with pagination, filter)
// @route   GET /api/quotes
// @access  Private
const getQuotes = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.search) {
      filter.quoteNumber = { $regex: req.query.search, $options: 'i' };
    }

    const [quotes, total] = await Promise.all([
      Quote.find(filter)
        .populate('customer', 'name email company')
        .skip(skip)
        .limit(limit)
        .sort('-createdAt'),
      Quote.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: quotes.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: quotes,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single quote
// @route   GET /api/quotes/:id
// @access  Private
const getQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findById(req.params.id).populate('customer', 'name email company phone address');

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
};

// @desc    Create quote
// @route   POST /api/quotes
// @access  Private
const createQuote = async (req, res, next) => {
  try {
    // Auto-generate quote number if not provided
    if (!req.body.quoteNumber) {
      req.body.quoteNumber = `QT-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // Auto-calculate item totals and grand total
    if (req.body.items && Array.isArray(req.body.items)) {
      req.body.items = req.body.items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));
      req.body.totalAmount = req.body.items.reduce((sum, item) => sum + item.total, 0);
    }

    const quote = await Quote.create(req.body);
    const populated = await quote.populate('customer', 'name email company');

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update quote
// @route   PUT /api/quotes/:id
// @access  Private
const updateQuote = async (req, res, next) => {
  try {
    // Recalculate totals if items are updated
    if (req.body.items && Array.isArray(req.body.items)) {
      req.body.items = req.body.items.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));
      req.body.totalAmount = req.body.items.reduce((sum, item) => sum + item.total, 0);
    }

    const quote = await Quote.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('customer', 'name email company');

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    res.status(200).json({ success: true, data: quote });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete quote
// @route   DELETE /api/quotes/:id
// @access  Private
const deleteQuote = async (req, res, next) => {
  try {
    const quote = await Quote.findByIdAndDelete(req.params.id);

    if (!quote) {
      return res.status(404).json({ success: false, message: 'Quote not found' });
    }

    res.status(200).json({ success: true, message: 'Quote deleted successfully' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getQuotes, getQuote, createQuote, updateQuote, deleteQuote };
