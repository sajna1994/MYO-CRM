const Payment = require('../models/Payment');
const Invoice = require('../models/Invoice');

// @desc    Get all payments (with pagination, filter)
// @route   GET /api/payments
// @access  Private
const getPayments = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.invoice) filter.invoice = req.query.invoice;
    if (req.query.method) filter.method = req.query.method;

    const [payments, total] = await Promise.all([
      Payment.find(filter)
        .populate({
          path: 'invoice',
          select: 'invoiceNumber totalAmount paidAmount status customer',
          populate: { path: 'customer', select: 'name email' },
        })
        .skip(skip)
        .limit(limit)
        .sort('-date'),
      Payment.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: payments.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: payments,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private
const getPayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id).populate({
      path: 'invoice',
      select: 'invoiceNumber totalAmount paidAmount status customer',
      populate: { path: 'customer', select: 'name email company' },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Create payment (and update invoice paidAmount + status)
// @route   POST /api/payments
// @access  Private
const createPayment = async (req, res, next) => {
  try {
    const { invoice: invoiceId, amount } = req.body;

    // Validate invoice exists
    const invoice = await Invoice.findById(invoiceId);
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found' });
    }

    // Validate payment amount doesn't exceed remaining balance
    const remaining = invoice.totalAmount - invoice.paidAmount;
    if (amount > remaining) {
      return res.status(400).json({
        success: false,
        message: `Payment amount ($${amount}) exceeds remaining balance ($${remaining.toFixed(2)})`,
      });
    }

    // Create payment
    const payment = await Payment.create(req.body);

    // Update invoice paidAmount and status
    invoice.paidAmount += amount;
    invoice.updatePaymentStatus();
    await invoice.save();

    // Return populated payment
    const populated = await payment.populate({
      path: 'invoice',
      select: 'invoiceNumber totalAmount paidAmount status',
    });

    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update payment
// @route   PUT /api/payments/:id
// @access  Private
const updatePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate({
      path: 'invoice',
      select: 'invoiceNumber totalAmount paidAmount status',
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    res.status(200).json({ success: true, data: payment });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete payment (and reduce invoice paidAmount)
// @route   DELETE /api/payments/:id
// @access  Private
const deletePayment = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id);

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Reverse the payment on the invoice
    const invoice = await Invoice.findById(payment.invoice);
    if (invoice) {
      invoice.paidAmount = Math.max(0, invoice.paidAmount - payment.amount);
      invoice.updatePaymentStatus();
      await invoice.save();
    }

    await Payment.findByIdAndDelete(req.params.id);

    res.status(200).json({ success: true, message: 'Payment deleted and invoice updated' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getPayments, getPayment, createPayment, updatePayment, deletePayment };
