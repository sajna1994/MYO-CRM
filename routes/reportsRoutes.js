const express = require('express');
const router = express.Router();
const { getSalesReport, getExpensesReport, getLeadsReport } = require('../controllers/reportsController');
const { protect } = require('../middleware/protect');

router.use(protect); // Require authentication for all reports

router.get('/sales', getSalesReport);
router.get('/purchases', getExpensesReport);
router.get('/leads', getLeadsReport);

module.exports = router;
