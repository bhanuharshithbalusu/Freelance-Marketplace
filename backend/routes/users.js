const express = require('express');
const {
    getUserProfile,
    updateProfile,
    getNotifications,
    markNotificationsRead,
    getDashboardStats,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/dashboard', protect, getDashboardStats);
router.get('/notifications', protect, getNotifications);
router.put('/notifications/read', protect, markNotificationsRead);
router.put('/profile', protect, updateProfile);
router.get('/:id', getUserProfile);

module.exports = router;
