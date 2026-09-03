const express = require('express');
const router = express.Router();
const { getLeads, getLead, createLead, updateLead, deleteLead } = require('../controllers/leadController');
const { protect } = require('../middleware/protect');

router.use(protect); // All lead routes require authentication

router.route('/').get(getLeads).post(createLead);
router.route('/:id').get(getLead).put(updateLead).delete(deleteLead);

module.exports = router;
