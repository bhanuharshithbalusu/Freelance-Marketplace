/**
 * Authentication Service
 * Business logic for user authentication
 */

import User from '../models/User.js';
import { generateTokens } from '../utils/jwt.js';
import { 
  BadRequestError, 
  UnauthorizedError, 
  ConflictError,
  NotFoundError 
} from '../utils/errors.js';

/**
 * Register new user
 * @param {Object} userData - User registration data
 * @returns {Object} { user, accessToken, refreshToken }
 */
export const registerUser = async (userData) => {
  const { name, email, password, role } = userData;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ConflictError('User with this email already exists');
  }

  // Validate role
  if (!['CLIENT', 'FREELANCER'].includes(role)) {
    throw new BadRequestError('Role must be either CLIENT or FREELANCER');
  }

  // Create new user
  const user = await User.create({
    name,
    email,
    password, // Will be hashed automatically by pre-save hook
    role
  });

  // Generate tokens
  const tokens = generateTokens(user);

  // Save refresh token to user
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    user: user.toPublicJSON(),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  };
};

/**
 * Login user
 * @param {String} email - User email
 * @param {String} password - User password
 * @returns {Object} { user, accessToken, refreshToken }
 */
export const loginUser = async (email, password) => {
  // Find user by email (include password field)
  const user = await User.findOne({ email }).select('+password');
  
  if (!user) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Check if account is active
  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    throw new UnauthorizedError('Invalid email or password');
  }

  // Generate tokens
  const tokens = generateTokens(user);

  // Save refresh token and update last login
  user.refreshToken = tokens.refreshToken;
  user.lastLogin = new Date();
  await user.save();

  return {
    user: user.toPublicJSON(),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  };
};

/**
 * Refresh access token
 * @param {String} refreshToken - Refresh token
 * @returns {Object} { accessToken, refreshToken }
 */
export const refreshAccessToken = async (refreshToken) => {
  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required');
  }

  // Find user with this refresh token
  const user = await User.findOne({ refreshToken }).select('+refreshToken');
  
  if (!user) {
    throw new UnauthorizedError('Invalid refresh token');
  }

  // Generate new tokens
  const tokens = generateTokens(user);

  // Update refresh token
  user.refreshToken = tokens.refreshToken;
  await user.save();

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken
  };
};

/**
 * Logout user
 * @param {String} userId - User ID
 */
export const logoutUser = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Remove refresh token
  user.refreshToken = null;
  await user.save();

  return { message: 'Logged out successfully' };
};

/**
 * Get current user
 * @param {String} userId - User ID
 * @returns {Object} User object
 */
export const getCurrentUser = async (userId) => {
  const user = await User.findById(userId);
  
  if (!user) {
    throw new NotFoundError('User not found');
  }

  if (!user.isActive) {
    throw new UnauthorizedError('Account is deactivated');
  }

  return user.toPublicJSON();
};

export default {
  registerUser,
  loginUser,
  refreshAccessToken,
  logoutUser,
  getCurrentUser
};
