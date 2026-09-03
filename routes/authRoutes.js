const express = require('express');
const router = express.Router();
const {
  register,
  login,
  getMe,
  updateMe,
  changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/protect');

// ─── Public Routes ───────────────────────────────────────────────────────────
router.post('/register', register);
router.post('/login', login);

// ─── Protected Routes (require JWT) ─────────────────────────────────────────
router.get('/me', protect, getMe);
router.put('/me', protect, updateMe);
router.put('/change-password', protect, changePassword);

module.exports = router;
