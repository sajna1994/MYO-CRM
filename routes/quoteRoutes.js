const express = require('express');
const router = express.Router();
const { getQuotes, getQuote, createQuote, updateQuote, deleteQuote } = require('../controllers/quoteController');
const { protect } = require('../middleware/protect');

router.use(protect);

router.route('/').get(getQuotes).post(createQuote);
router.route('/:id').get(getQuote).put(updateQuote).delete(deleteQuote);

module.exports = router;
