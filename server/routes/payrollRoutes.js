const express = require('express');
const router = express.Router();
const { getPayrolls, getPayroll, createPayroll, updatePayroll, deletePayroll, generatePayroll } = require('../controllers/payrollController');
const { protect, restrictTo } = require('../middleware/protect');

router.use(protect);

router.route('/').get(getPayrolls).post(createPayroll);
router.post('/generate', restrictTo('admin'), generatePayroll);
router.route('/:id').get(getPayroll).put(updatePayroll).delete(deletePayroll);

module.exports = router;
