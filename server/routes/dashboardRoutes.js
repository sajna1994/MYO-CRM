const express = require('express');
const router = express.Router();
const { getDashboardStats } = require('../controllers/dashboardController');
const { protect } = require('../middleware/protect');

router.use(protect); // Secure connection

router.get('/stats', getDashboardStats);

module.exports = router;
