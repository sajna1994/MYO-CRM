const express = require('express');

const router = express.Router();

const {
  getSalesReport,
  getExpensesReport,
  getLeadsReport,
} = require('../controllers/reportsController');

const { protect } = require('../middleware/protect');


// All report APIs require authentication
router.use(protect);


// Sales
router.get(
  '/sales',
  getSalesReport
);


// Purchases / Expenses
router.get(
  '/purchases',
  getExpensesReport
);


// Leads
router.get(
  '/leads',
  getLeadsReport
);


module.exports = router;