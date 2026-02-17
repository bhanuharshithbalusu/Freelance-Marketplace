const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const { validationResult } = require('express-validator');
const { OAuth2Client } = require('google-auth-library');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// @desc    Register user
// @route   POST /api/auth/signup
exports.signup = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, email, password, role } = req.body;

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        const user = await User.create({ name, email, password, role, authProvider: 'local' });

        const token = generateToken(user._id);

        res.status(201).json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Login user
// @route   POST /api/auth/login
exports.login = async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { email, password } = req.body;

        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // If user signed up with Google, tell them to use Google login
        if (user.authProvider === 'google' && !user.password) {
            return res.status(400).json({
                success: false,
                message: 'This account was created with Google. Please use Google Sign-In.',
            });
        }

        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio,
                skills: user.skills,
            },
        });
    } catch (error) {
        next(error);
    }
};

// @desc    Google OAuth login/signup
// @route   POST /api/auth/google
exports.googleAuth = async (req, res, next) => {
    try {
        const { credential, role } = req.body;

        if (!credential) {
            return res.status(400).json({ success: false, message: 'Google credential is required' });
        }

        // Verify the Google token
        const ticket = await googleClient.verifyIdToken({
            idToken: credential,
            audience: process.env.GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        const { sub: googleId, email, name, picture } = payload;

        // Check if user already exists (by googleId or email)
        let user = await User.findOne({ $or: [{ googleId }, { email }] });

        if (user) {
            // User exists — update googleId if they previously signed up with email
            if (!user.googleId) {
                user.googleId = googleId;
                user.authProvider = 'google';
                if (picture && !user.avatar) user.avatar = picture;
                await user.save();
            }
        } else {
            // New user — create account
            if (!role || !['client', 'freelancer'].includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Please select a role (client or freelancer)',
                    requiresRole: true,
                });
            }

            user = await User.create({
                name,
                email,
                googleId,
                avatar: picture || '',
                role,
                authProvider: 'google',
            });
        }

        const token = generateToken(user._id);

        res.json({
            success: true,
            token,
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                avatar: user.avatar,
                bio: user.bio,
                skills: user.skills,
            },
        });
    } catch (error) {
        console.error('Google auth error:', error);
        if (error.message?.includes('Token used too late') || error.message?.includes('Invalid token')) {
            return res.status(401).json({ success: false, message: 'Invalid or expired Google token. Please try again.' });
        }
        next(error);
    }
};

// @desc    Get current user
// @route   GET /api/auth/me
exports.getMe = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);
        res.json({ success: true, user });
    } catch (error) {
        next(error);
    }
};
