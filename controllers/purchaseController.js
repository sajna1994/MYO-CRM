
const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');

// ============================================================
// GET ALL PURCHASES
// ============================================================

const getPurchases = async (req, res, next) => {
  try {
    const page = Math.max(
      parseInt(req.query.page, 10) || 1,
      1
    );

    const limit = Math.min(
      Math.max(
        parseInt(req.query.limit, 10) || 10,
        1
      ),
      100
    );

    const skip = (page - 1) * limit;

    const filter = {};

    // --------------------------------------------------------
    // SEARCH
    // --------------------------------------------------------
    if (req.query.search?.trim()) {
      const search = req.query.search.trim();

      // Find suppliers whose name/contact/phone matches search
      const Supplier = mongoose.model('Supplier');

      const matchingSuppliers = await Supplier.find({
        $or: [
          {
            name: {
              $regex: search,
              $options: 'i',
            },
          },
          {
            contactPerson: {
              $regex: search,
              $options: 'i',
            },
          },
          {
            phone: {
              $regex: search,
              $options: 'i',
            },
          },
        ],
      }).select('_id');

      const supplierIds = matchingSuppliers.map(
        (supplier) => supplier._id
      );

      filter.$or = [
        {
          invoiceNumber: {
            $regex: search,
            $options: 'i',
          },
        },
        {
          supplier: {
            $in: supplierIds,
          },
        },
        {
          'items.product': {
            $regex: search,
            $options: 'i',
          },
        },
      ];
    }

    // --------------------------------------------------------
    // SUPPLIER FILTER
    // --------------------------------------------------------
    if (req.query.supplier) {
      if (mongoose.Types.ObjectId.isValid(req.query.supplier)) {
        filter.supplier = req.query.supplier;
      }
    }

    // --------------------------------------------------------
    // STATUS FILTER
    // --------------------------------------------------------
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // --------------------------------------------------------
    // DATE FILTER
    // --------------------------------------------------------
    if (
      req.query.startDate ||
      req.query.endDate
    ) {
      filter.date = {};

      if (req.query.startDate) {
        const startDate = new Date(
          req.query.startDate
        );

        if (!Number.isNaN(startDate.getTime())) {
          filter.date.$gte = startDate;
        }
      }

      if (req.query.endDate) {
        const endDate = new Date(
          req.query.endDate
        );

        if (!Number.isNaN(endDate.getTime())) {
          endDate.setHours(
            23,
            59,
            59,
            999
          );

          filter.date.$lte = endDate;
        }
      }
    }

    // --------------------------------------------------------
    // GET PURCHASES
    // --------------------------------------------------------
    const [
      purchases,
      total,
    ] = await Promise.all([
      Purchase.find(filter)
        .populate(
          'supplier',
          'name contactPerson phone email landline website gstNumber address notes'
        )
        .populate(
          'createdBy',
          'name email'
        )
        .sort({
          date: -1,
          createdAt: -1,
        })
        .skip(skip)
        .limit(limit),

      Purchase.countDocuments(filter),
    ]);

    // --------------------------------------------------------
    // TOTAL PURCHASE AMOUNT
    // --------------------------------------------------------
    const totalAmountResult =
      await Purchase.aggregate([
        {
          $match: filter,
        },
        {
          $group: {
            _id: null,
            total: {
              $sum: '$totalAmount',
            },
          },
        },
      ]);

    const totalAmount =
      totalAmountResult[0]?.total || 0;

    res.status(200).json({
      success: true,
      count: purchases.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      totalAmount,
      data: purchases,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// GET SINGLE PURCHASE
// ============================================================

const getPurchase = async (
  req,
  res,
  next
) => {
  try {
    const purchase =
      await Purchase.findById(
        req.params.id
      )
        .populate(
          'supplier',
          'name contactPerson phone email landline website gstNumber address notes'
        )
        .populate(
          'createdBy',
          'name email'
        );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    res.status(200).json({
      success: true,
      data: purchase,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// CREATE PURCHASE
// ============================================================

const createPurchase = async (
  req,
  res,
  next
) => {
  try {
    const {
      invoiceNumber,
      supplier,
      items,
      date,
      status,
      notes,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATE INVOICE NUMBER
    // --------------------------------------------------------
    if (!invoiceNumber?.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Invoice number is required',
      });
    }

    // --------------------------------------------------------
    // VALIDATE SUPPLIER
    // --------------------------------------------------------
    if (!supplier) {
      return res.status(400).json({
        success: false,
        message: 'Supplier is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(supplier)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid supplier',
      });
    }

    // --------------------------------------------------------
    // VALIDATE ITEMS
    // --------------------------------------------------------
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'At least one product is required',
      });
    }

    // --------------------------------------------------------
    // FORMAT ITEMS
    // --------------------------------------------------------
    const formattedItems =
      items.map((item, index) => {
        const quantity =
          Number(item.quantity);

        const unitPrice =
          Number(item.unitPrice);

        if (!item.product?.trim()) {
          throw new Error(
            `Product is required for item ${index + 1}`
          );
        }

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          throw new Error(
            `Invalid quantity for ${item.product}`
          );
        }

        if (
          !Number.isFinite(unitPrice) ||
          unitPrice <= 0
        ) {
          throw new Error(
            `Invalid unit price for ${item.product}`
          );
        }

        return {
          product: item.product.trim(),

          quantity,

          unitPrice,

          totalPrice:
            quantity * unitPrice,
        };
      });

    // --------------------------------------------------------
    // CALCULATE TOTAL
    // --------------------------------------------------------
    const totalAmount =
      formattedItems.reduce(
        (sum, item) =>
          sum + item.totalPrice,
        0
      );

    // --------------------------------------------------------
    // CREATE PURCHASE
    // --------------------------------------------------------
    const purchase =
      await Purchase.create({
        invoiceNumber:
          invoiceNumber.trim(),

        // IMPORTANT:
        // Supplier is now ObjectId
        supplier,

        items: formattedItems,

        totalAmount,

        date:
          date || new Date(),

        status:
          status || 'received',

        notes:
          notes?.trim() || '',

        createdBy:
          req.user?._id || null,
      });

    // --------------------------------------------------------
    // RETURN POPULATED PURCHASE
    // --------------------------------------------------------
    const populatedPurchase =
      await Purchase.findById(
        purchase._id
      )
        .populate(
          'supplier',
          'name contactPerson phone email landline website gstNumber address notes'
        )
        .populate(
          'createdBy',
          'name email'
        );

    res.status(201).json({
      success: true,
      message:
        'Purchase created successfully',
      data: populatedPurchase,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// UPDATE PURCHASE
// ============================================================

const updatePurchase = async (
  req,
  res,
  next
) => {
  try {
    const purchase =
      await Purchase.findById(
        req.params.id
      );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message: 'Purchase not found',
      });
    }

    const {
      invoiceNumber,
      supplier,
      items,
      date,
      status,
      notes,
    } = req.body;

    // --------------------------------------------------------
    // VALIDATE INVOICE + SUPPLIER
    // --------------------------------------------------------
    if (!invoiceNumber?.trim()) {
      return res.status(400).json({
        success: false,
        message:
          'Invoice number is required',
      });
    }

    if (!supplier) {
      return res.status(400).json({
        success: false,
        message:
          'Supplier is required',
      });
    }

    if (!mongoose.Types.ObjectId.isValid(supplier)) {
      return res.status(400).json({
        success: false,
        message:
          'Invalid supplier',
      });
    }

    // --------------------------------------------------------
    // VALIDATE ITEMS
    // --------------------------------------------------------
    if (
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          'At least one product is required',
      });
    }

    // --------------------------------------------------------
    // FORMAT ITEMS
    // --------------------------------------------------------
    const formattedItems =
      items.map((item, index) => {
        const quantity =
          Number(item.quantity);

        const unitPrice =
          Number(item.unitPrice);

        if (!item.product?.trim()) {
          throw new Error(
            `Product is required for item ${index + 1}`
          );
        }

        if (
          !Number.isFinite(quantity) ||
          quantity <= 0
        ) {
          throw new Error(
            `Invalid quantity for ${item.product}`
          );
        }

        if (
          !Number.isFinite(unitPrice) ||
          unitPrice <= 0
        ) {
          throw new Error(
            `Invalid unit price for ${item.product}`
          );
        }

        return {
          product:
            item.product.trim(),

          quantity,

          unitPrice,

          totalPrice:
            quantity * unitPrice,
        };
      });

    // --------------------------------------------------------
    // CALCULATE TOTAL
    // --------------------------------------------------------
    const totalAmount =
      formattedItems.reduce(
        (sum, item) =>
          sum + item.totalPrice,
        0
      );

    // --------------------------------------------------------
    // UPDATE PURCHASE
    // --------------------------------------------------------
    purchase.invoiceNumber =
      invoiceNumber.trim();

    // IMPORTANT:
    // Supplier is ObjectId, NOT string
    purchase.supplier =
      supplier;

    purchase.items =
      formattedItems;

    purchase.totalAmount =
      totalAmount;

    purchase.date =
      date || purchase.date;

    purchase.status =
      status || purchase.status;

    purchase.notes =
      notes?.trim() || '';

    await purchase.save();

    // --------------------------------------------------------
    // RETURN POPULATED PURCHASE
    // --------------------------------------------------------
    const populatedPurchase =
      await Purchase.findById(
        purchase._id
      )
        .populate(
          'supplier',
          'name contactPerson phone email landline website gstNumber address notes'
        )
        .populate(
          'createdBy',
          'name email'
        );

    res.status(200).json({
      success: true,
      message:
        'Purchase updated successfully',
      data: populatedPurchase,
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// DELETE PURCHASE
// ============================================================

const deletePurchase = async (
  req,
  res,
  next
) => {
  try {
    const purchase =
      await Purchase.findByIdAndDelete(
        req.params.id
      );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        message:
          'Purchase not found',
      });
    }

    res.status(200).json({
      success: true,
      message:
        'Purchase deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};


// ============================================================
// EXPORTS
// ============================================================

module.exports = {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
};
