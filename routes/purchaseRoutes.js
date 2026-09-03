const express = require('express');

const router = express.Router();

const {
  getPurchases,
  getPurchase,
  createPurchase,
  updatePurchase,
  deletePurchase,
} = require('../controllers/purchaseController');

const { protect } = require('../middleware/protect');


// All purchase routes require authentication
router.use(protect);


// GET    /api/purchases
// POST   /api/purchases
router
  .route('/')
  .get(getPurchases)
  .post(createPurchase);


// GET    /api/purchases/:id
// PUT    /api/purchases/:id
// DELETE /api/purchases/:id
router
  .route('/:id')
  .get(getPurchase)
  .put(updatePurchase)
  .delete(deletePurchase);


module.exports = router;