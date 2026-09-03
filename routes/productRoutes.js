const express = require('express');
const router = express.Router();
const { getProducts, getProduct, createProduct, updateProduct, deleteProduct, updateStock } = require('../controllers/productController');
const { protect } = require('../middleware/protect');

router.use(protect);

router.route('/').get(getProducts).post(createProduct);
router.route('/:id').get(getProduct).put(updateProduct).delete(deleteProduct);
router.patch('/:id/stock', updateStock);

module.exports = router;
