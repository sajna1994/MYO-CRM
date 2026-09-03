const express = require('express');
const router = express.Router();
const {
  getUsers,
  getUserById,
  updateUser,
  deleteUser,
} = require('../controllers/userController');
const { protect, restrictTo } = require('../middleware/protect');

// All user-management routes require auth + admin role
router.use(protect);
router.use(restrictTo('admin'));

router.route('/').get(getUsers);
router.route('/:id').get(getUserById).put(updateUser).delete(deleteUser);

module.exports = router;
