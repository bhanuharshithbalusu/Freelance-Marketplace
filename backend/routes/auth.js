const express = require('express');
const { body } = require('express-validator');
const { signup, login, getMe, googleAuth } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post(
    '/signup',
    [
        body('name').trim().notEmpty().withMessage('Name is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
        body('role').isIn(['client', 'freelancer']).withMessage('Role must be client or freelancer'),
    ],
    signup
);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required'),
    ],
    login
);

// Google OAuth
router.post('/google', googleAuth);

router.get('/me', protect, getMe);

module.exports = router;
