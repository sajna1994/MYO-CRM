const Order = require('../models/Order');
const Product = require('../models/Product');

// @desc    Get all orders (paginated, filterable)
// @route   GET /api/orders
const getOrders = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.search) {
      filter.orderNumber = { $regex: req.query.search, $options: 'i' };
    }

    const [orders, total] = await Promise.all([
      Order.find(filter)
        .populate('customer', 'name email company')
        .skip(skip)
        .limit(limit)
        .sort('-createdAt'),
      Order.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: orders.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: orders,
    });
  } catch (error) {
    next(error);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
const getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('customer', 'name email company phone address')
      .populate('products.product', 'name sku price');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Create order (and reduce product stock)
// @route   POST /api/orders
const createOrder = async (req, res, next) => {
  try {
    // Auto-generate order number if not provided
    if (!req.body.orderNumber) {
      req.body.orderNumber = `ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    }

    // Auto-calculate item totals and grand total
    if (req.body.products && Array.isArray(req.body.products)) {
      req.body.products = req.body.products.map((item) => ({
        ...item,
        total: item.quantity * item.unitPrice,
      }));
      req.body.totalAmount = req.body.products.reduce((sum, item) => sum + item.total, 0);
    }

    const order = await Order.create(req.body);

    // Reduce stock for each product
    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    const populated = await order.populate('customer', 'name email company');
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Update order
// @route   PUT /api/orders/:id
const updateOrder = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate('customer', 'name email company');
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete order (and restore product stock)
// @route   DELETE /api/orders/:id
const deleteOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    // Restore stock if order was not already cancelled
    if (order.status !== 'cancelled') {
      for (const item of order.products) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: item.quantity },
        });
      }
    }

    await Order.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Order deleted and stock restored' });
  } catch (error) {
    next(error);
  }
};

module.exports = { getOrders, getOrder, createOrder, updateOrder, deleteOrder };
