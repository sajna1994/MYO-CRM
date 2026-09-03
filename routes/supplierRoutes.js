const express = require('express');

const router = express.Router();

const {
  getSuppliers,
  getSupplier,
  createSupplier,
  updateSupplier,
  deleteSupplier,
} = require('../controllers/supplierController');

const { protect } = require('../middleware/protect');

// All supplier routes require authentication
router.use(protect);

// GET /api/suppliers
// POST /api/suppliers
router
  .route('/')
  .get(getSuppliers)
  .post(createSupplier);

// GET /api/suppliers/:id
// PUT /api/suppliers/:id
// DELETE /api/suppliers/:id
router
  .route('/:id')
  .get(getSupplier)
  .put(updateSupplier)
  .delete(deleteSupplier);

module.exports = router;