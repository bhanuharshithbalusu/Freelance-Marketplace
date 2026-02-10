/**
 * Authentication Controller
 * Handle HTTP requests for authentication
 */

import asyncHandler from '../middlewares/asyncHandler.js';
import * as authService from '../services/auth.service.js';
import { generateTokens } from '../utils/jwt.js';
import { apiResponse } from '../utils/helpers.js';

/**
 * @route   POST /api/auth/register
 * @desc    Register new user
 * @access  Public
 */
export const register = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;

  const result = await authService.registerUser({
    name,
    email,
    password,
    role
  });

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(201).json(
    apiResponse(
      true,
      'User registered successfully',
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    )
  );
});

/**
 * @route   POST /api/auth/login
 * @desc    Login user
 * @access  Public
 */
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const result = await authService.loginUser(email, password);

  // Set refresh token in HTTP-only cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json(
    apiResponse(
      true,
      'Logged in successfully',
      {
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    )
  );
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
export const refresh = asyncHandler(async (req, res) => {
  // Get refresh token from cookie or body
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;

  const result = await authService.refreshAccessToken(refreshToken);

  // Update refresh token in cookie
  res.cookie('refreshToken', result.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  res.status(200).json(
    apiResponse(
      true,
      'Token refreshed successfully',
      {
        accessToken: result.accessToken,
        refreshToken: result.refreshToken
      }
    )
  );
});

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user
 * @access  Private
 */
export const logout = asyncHandler(async (req, res) => {
  await authService.logoutUser(req.user.id);

  // Clear refresh token cookie
  res.clearCookie('refreshToken');

  res.status(200).json(
    apiResponse(true, 'Logged out successfully')
  );
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user
 * @access  Private
 */
export const getMe = asyncHandler(async (req, res) => {
  const user = await authService.getCurrentUser(req.user.id);

  res.status(200).json(
    apiResponse(true, 'User retrieved successfully', user)
  );
});

/**
 * @route   GET /api/auth/google/callback
 * @desc    Google OAuth callback handler
 * @access  Public
 */
export const googleCallback = asyncHandler(async (req, res) => {
  console.log('🔐 Google OAuth callback - generating tokens');
  
  // User is already authenticated by Passport
  const user = req.user;
  
  // Generate tokens
  const { accessToken, refreshToken } = generateTokens(user);
  
  console.log('✅ Tokens generated for Google user:', user.email);
  
  // Update user's refresh token in database
  user.refreshToken = refreshToken;
  user.lastLogin = new Date();
  await user.save();
  
  // Set refresh token in cookie
  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
  
  // Redirect to frontend with tokens
  const clientUrl = process.env.CLIENT_URL || 'http://localhost:3002';
  const redirectUrl = `${clientUrl}/auth/google/success?token=${accessToken}&role=${user.role}`;
  
  console.log('🔄 Redirecting to:', redirectUrl);
  res.redirect(redirectUrl);
});

export default {
  register,
  login,
  refresh,
  logout,
  getMe,
  googleCallback
};
