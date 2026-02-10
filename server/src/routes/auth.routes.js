/**
 * Authentication Routes
 * Step 3.1 - Auth APIs
 * Step 8 - Enhanced with validation & rate limiting
 * 
 * POST /api/auth/register - Register new user
 * POST /api/auth/login - Login user
 * POST /api/auth/refresh - Refresh access token
 * POST /api/auth/logout - Logout user
 * GET /api/auth/me - Get current user
 */

import express from 'express';
import passport from '../config/passport.js';
import * as authController from '../controllers/auth.controller.js';
import * as passwordResetController from '../controllers/passwordReset.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { validate } from '../middlewares/validate.js';
import {
  registerValidation,
  loginValidation,
  refreshValidation
} from '../middlewares/authValidation.js';
import {
  authLimiter,
  registerLimiter
} from '../middlewares/rateLimiter.js';
import {
  sanitizeBody,
  preventNoSQLInjection
} from '../middlewares/sanitization.js';

const router = express.Router();

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Auth API is running',
    timestamp: new Date().toISOString()
  });
});

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
router.post(
  '/register',
  registerLimiter,
  sanitizeBody,
  preventNoSQLInjection,
  registerValidation,
  validate,
  authController.register
);

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  sanitizeBody,
  preventNoSQLInjection,
  loginValidation,
  validate,
  authController.login
);

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  refreshValidation,
  validate,
  authController.refresh
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post(
  '/logout',
  authenticate,
  authController.logout
);

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get(
  '/me',
  authenticate,
  authController.getMe
);

/**
 * Google OAuth Routes
 */

// Check if Google OAuth is configured
const hasGoogleCredentials = 
  process.env.GOOGLE_CLIENT_ID && 
  process.env.GOOGLE_CLIENT_ID !== 'your-google-client-id-here' &&
  process.env.GOOGLE_CLIENT_SECRET && 
  process.env.GOOGLE_CLIENT_SECRET !== 'your-google-client-secret-here';

if (hasGoogleCredentials) {
  /**
   * @route   GET /api/auth/google
   * @desc    Initiate Google OAuth flow
   * @access  Public
   */
  router.get(
    '/google',
    passport.authenticate('google', { 
      scope: ['profile', 'email'],
      session: false 
    })
  );

  /**
   * @route   GET /api/auth/google/callback
   * @desc    Google OAuth callback
   * @access  Public
   */
  router.get(
    '/google/callback',
    passport.authenticate('google', { 
      session: false,
      failureRedirect: `${process.env.CLIENT_URL}/login?error=google_auth_failed`
    }),
    authController.googleCallback
  );
} else {
  // Provide helpful error message if Google OAuth is not configured
  router.get('/google', (req, res) => {
    res.status(503).json({
      success: false,
      message: 'Google OAuth is not configured. Please set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET in .env file.'
    });
  });
  
  router.get('/google/callback', (req, res) => {
    res.redirect(`${process.env.CLIENT_URL}/login?error=google_not_configured`);
  });
}

/**
 * Password Reset Routes
 */

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
router.post(
  '/forgot-password',
  authLimiter,
  sanitizeBody,
  preventNoSQLInjection,
  passwordResetController.forgotPassword
);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
router.post(
  '/reset-password',
  authLimiter,
  sanitizeBody,
  preventNoSQLInjection,
  passwordResetController.resetPassword
);

/**
 * @route   GET /api/auth/verify-reset-token/:token
 * @desc    Verify if reset token is valid
 * @access  Public
 */
router.get(
  '/verify-reset-token/:token',
  passwordResetController.verifyResetToken
);

export default router;
