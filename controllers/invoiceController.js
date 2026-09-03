const Invoice = require('../models/Invoice');


// ==========================================================
// Generate Invoice Number
// ==========================================================

const generateInvoiceNumber = async () => {
  const year = new Date().getFullYear();

  const lastInvoice = await Invoice.findOne({
    invoiceNumber: {
      $regex: `^INV-${year}-`,
    },
  })
    .sort({ createdAt: -1 })
    .select('invoiceNumber');

  let nextNumber = 1;

  if (lastInvoice?.invoiceNumber) {
    const match = lastInvoice.invoiceNumber.match(
      /INV-\d{4}-(\d+)/
    );

    if (match) {
      nextNumber = Number(match[1]) + 1;
    }
  }

  return `INV-${year}-${String(nextNumber).padStart(4, '0')}`;
};


// ==========================================================
// GET ALL INVOICES
// ==========================================================

const getInvoices = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.status) {
      if (req.query.status.includes(',')) {
        filter.status = {
          $in: req.query.status.split(','),
        };
      } else {
        filter.status = req.query.status;
      }
    }

    if (req.query.customer) {
      filter.customer = req.query.customer;
    }

    if (req.query.search) {
      filter.invoiceNumber = {
        $regex: req.query.search,
        $options: 'i',
      };
    }

    if (req.query.overdue === 'true') {
      filter.status = {
        $in: ['unpaid', 'partial'],
      };

      filter.dueDate = {
        $lt: new Date(),
      };
    }

    const [invoices, total] = await Promise.all([
      Invoice.find(filter)
        .populate(
          'customer',
          'name email company phone address'
        )
        .skip(skip)
        .limit(limit)
        .sort('-createdAt'),

      Invoice.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: invoices.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: invoices,
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================================
// GET SINGLE INVOICE
// ==========================================================

const getInvoice = async (req, res, next) => {
  try {
    const invoice = await Invoice.findById(req.params.id)
      .populate(
        'customer',
        'name email company phone address'
      );

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.status(200).json({
      success: true,
      data: invoice,
    });
  } catch (error) {
    next(error);
  }
};


// ==========================================================
// CREATE INVOICE
// ==========================================================

const createInvoice = async (req, res, next) => {
  try {
    console.log('CREATE INVOICE BODY:');
    console.log(JSON.stringify(req.body, null, 2));

   const {
  customer,
  customerName,
  phone,
  items,
  discount = 0,
  status = 'unpaid',
  dueDate,
  notes = '',
} = req.body;


    // ------------------------------------------------------
    // Validate customer
    // ------------------------------------------------------

    if (!customer) {
      return res.status(400).json({
        success: false,
        message: 'Customer is required',
      });
    }


    // ------------------------------------------------------
    // Validate items
    // ------------------------------------------------------

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'At least one product is required',
      });
    }


    // ------------------------------------------------------
    // Validate due date
    // ------------------------------------------------------

    if (!dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Invoice date / due date is required',
      });
    }


    // ------------------------------------------------------
    // Calculate items
    // ------------------------------------------------------

   const formattedItems = items.map((item) => {
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);

  if (
    !item.description ||
    !String(item.description).trim()
  ) {
    throw new Error(
      'Product description is required'
    );
  }

  if (
    !Number.isFinite(quantity) ||
    quantity < 1
  ) {
    throw new Error(
      `Invalid quantity for ${item.description}`
    );
  }

  if (
    !Number.isFinite(unitPrice) ||
    unitPrice < 0
  ) {
    throw new Error(
      `Invalid price for ${item.description}`
    );
  }

  return {
    description:
      String(item.description).trim(),

    quantity,

    unitPrice,

    total:
      quantity * unitPrice,
  };
});


    // ------------------------------------------------------
    // Calculate totals
    // ------------------------------------------------------

    const subtotal = formattedItems.reduce(
      (sum, item) => sum + item.total,
      0
    );

    const discountAmount = Math.max(
      0,
      Number(discount) || 0
    );

    const finalDiscount = Math.min(
      discountAmount,
      subtotal
    );

    const totalAmount = Math.max(
      0,
      subtotal - finalDiscount
    );


    // ------------------------------------------------------
    // Generate invoice number on SERVER
    // ------------------------------------------------------

    let invoiceNumber = await generateInvoiceNumber();


    // ------------------------------------------------------
    // Create invoice
    // ------------------------------------------------------

    let invoice;

    try {
     invoice = await Invoice.create({
  invoiceNumber,
  customer,
  customerName,
  phone,
  items: formattedItems,
  subtotal,
  discount: finalDiscount,
  totalAmount,
  paidAmount: 0,
  status,
  dueDate: new Date(dueDate),
  notes,
});
    } catch (error) {

      // Handle rare duplicate invoice number
     if (error.code === 11000) {
  invoiceNumber = `INV-${new Date().getFullYear()}-${Date.now()
    .toString()
    .slice(-6)}`;

  invoice = await Invoice.create({
    invoiceNumber,
    customer,
    customerName,
    phone,
    items: formattedItems,
    subtotal,
    discount: finalDiscount,
    totalAmount,
    paidAmount: 0,
    status,
    dueDate: new Date(dueDate),
    notes,
  });
} else {
        throw error;
      }
    }


    // ------------------------------------------------------
    // Populate customer
    // ------------------------------------------------------

    const populated = await invoice.populate(
      'customer',
      'name email company phone address'
    );


    // ------------------------------------------------------
    // Response
    // ------------------------------------------------------

    res.status(201).json({
      success: true,
      message: 'Invoice created successfully',
      data: populated,
    });

  } catch (error) {

    console.error('CREATE INVOICE ERROR:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(', '),
        errors: error.errors,
      });
    }

    if (error.name === 'CastError') {
      return res.status(400).json({
        success: false,
        message: `Invalid ${error.path}: ${error.value}`,
      });
    }

    next(error);
  }
};


// ==========================================================
// UPDATE INVOICE
// ==========================================================

const updateInvoice = async (req, res, next) => {
  try {
    const {
      customer,
      items,
      discount = 0,
      status,
      dueDate,
      notes,
    } = req.body;


    let updateData = {
      customer,
      status,
      dueDate,
      notes,
    };


    if (Array.isArray(items)) {

      if (items.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'At least one product is required',
        });
      }

      const formattedItems = items.map((item) => {
  const quantity = Number(item.quantity);
  const unitPrice = Number(item.unitPrice);

  if (
    !item.description ||
    !String(item.description).trim()
  ) {
    throw new Error(
      'Product description is required'
    );
  }

  if (
    !Number.isFinite(quantity) ||
    quantity < 1
  ) {
    throw new Error(
      `Invalid quantity for ${item.description}`
    );
  }

  if (
    !Number.isFinite(unitPrice) ||
    unitPrice < 0
  ) {
    throw new Error(
      `Invalid price for ${item.description}`
    );
  }

  return {
    description:
      String(item.description).trim(),

    quantity,

    unitPrice,

    total:
      quantity * unitPrice,
  };
});


      const subtotal = formattedItems.reduce(
        (sum, item) => sum + item.total,
        0
      );

      const discountAmount = Math.max(
        0,
        Number(discount) || 0
      );

      const finalDiscount = Math.min(
        discountAmount,
        subtotal
      );

      const totalAmount = Math.max(
        0,
        subtotal - finalDiscount
      );


      updateData = {
        ...updateData,
        items: formattedItems,
        subtotal,
        discount: finalDiscount,
        totalAmount,
      };
    }


    const invoice =
      await Invoice.findByIdAndUpdate(
        req.params.id,
        updateData,
        {
          new: true,
          runValidators: true,
        }
      ).populate(
        'customer',
        'name email company phone address'
      );


    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }


    res.status(200).json({
      success: true,
      message: 'Invoice updated successfully',
      data: invoice,
    });

  } catch (error) {

    console.error('UPDATE INVOICE ERROR:', error);

    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors)
          .map((err) => err.message)
          .join(', '),
      });
    }

    next(error);
  }
};


// ==========================================================
// DELETE INVOICE
// ==========================================================

const deleteInvoice = async (req, res, next) => {
  try {
    const invoice =
      await Invoice.findByIdAndDelete(req.params.id);

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: 'Invoice not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Invoice deleted successfully',
    });

  } catch (error) {
    next(error);
  }
};


module.exports = {
  getInvoices,
  getInvoice,
  createInvoice,
  updateInvoice,
  deleteInvoice,
};