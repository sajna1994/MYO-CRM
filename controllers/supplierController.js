const Supplier = require('../models/Supplier');

// ============================================================
// GET ALL SUPPLIERS
// GET /api/suppliers
// ============================================================

const getSuppliers = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;

    const skip = (page - 1) * limit;

    const filter = {};

    // Search
    if (req.query.search) {
      filter.$or = [
        {
          name: {
            $regex: req.query.search,
            $options: 'i',
          },
        },
        {
          contactPerson: {
            $regex: req.query.search,
            $options: 'i',
          },
        },
        {
          phone: {
            $regex: req.query.search,
            $options: 'i',
          },
        },
        {
          email: {
            $regex: req.query.search,
            $options: 'i',
          },
        },
      ];
    }

    // Active filter
    if (req.query.active !== undefined) {
      filter.isActive = req.query.active === 'true';
    }

    const [suppliers, total] = await Promise.all([
      Supplier.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 }),

      Supplier.countDocuments(filter),
    ]);

    res.status(200).json({
      success: true,
      count: suppliers.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: suppliers,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET SINGLE SUPPLIER
// GET /api/suppliers/:id
// ============================================================

const getSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findById(req.params.id);

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// CREATE SUPPLIER
// POST /api/suppliers
// ============================================================

const createSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.create(req.body);

    res.status(201).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE SUPPLIER
// PUT /api/suppliers/:id
// ============================================================

const updateSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.status(200).json({
      success: true,
      data: supplier,
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE SUPPLIER
// DELETE /api/suppliers/:id
// ============================================================

const deleteSupplier = async (req, res, next) => {
  try {
    const supplier = await Supplier.findByIdAndDelete(
      req.params.id
    );

    if (!supplier) {
      return res.status(404).json({
        success: false,
        message: 'Supplier not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Supplier deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
};