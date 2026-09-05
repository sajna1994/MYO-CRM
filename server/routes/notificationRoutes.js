const express = require('express');
const router = express.Router();
const { getNotifications, createNotification, markAsRead, markAllAsRead } = require('../controllers/notificationController');
const { protect } = require('../middleware/protect');

router.use(protect); // All notification routes require authentication

router.route('/').get(getNotifications).post(createNotification);
router.patch('/read-all', markAllAsRead);
router.patch('/:id/read', markAsRead);

module.exports = router;
