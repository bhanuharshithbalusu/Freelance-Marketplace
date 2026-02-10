/**
 * Password Reset Service
 * Business logic for password reset functionality
 */

import crypto from 'crypto';
import User from '../models/User.js';
import { BadRequestError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

/**
 * Generate password reset token
 * @param {String} email - User email
 * @returns {Object} { resetToken, user }
 */
export const generateResetToken = async (email) => {
  // Find user by email
  const user = await User.findOne({ email });
  
  if (!user) {
    // Don't reveal if user exists or not for security
    // Return success anyway to prevent user enumeration
    return { 
      success: true, 
      message: 'If an account exists with this email, a reset link has been sent.' 
    };
  }

  // Generate reset token
  const resetToken = crypto.randomBytes(32).toString('hex');
  
  // Hash token before storing
  const hashedToken = crypto
    .createHash('sha256')
    .update(resetToken)
    .digest('hex');

  // Set reset token and expiry (1 hour)
  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
  await user.save();

  console.log('🔐 Password reset token generated for:', user.email);
  console.log('📧 Reset token (for development):', resetToken);

  return {
    success: true,
    resetToken, // In production, this would be sent via email
    user: {
      email: user.email,
      name: user.name
    },
    message: 'If an account exists with this email, a reset link has been sent.'
  };
};

/**
 * Verify reset token
 * @param {String} token - Reset token
 * @returns {Object} User object
 */
export const verifyResetToken = async (token) => {
  // Hash the token to compare with stored hash
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  // Find user with valid token
  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    throw new BadRequestError('Invalid or expired reset token');
  }

  return user;
};

/**
 * Reset password
 * @param {String} token - Reset token
 * @param {String} newPassword - New password
 * @returns {Object} Success message
 */
export const resetPassword = async (token, newPassword) => {
  // Verify token and get user
  const user = await verifyResetToken(token);

  // Set new password (will be hashed by pre-save hook)
  user.password = newPassword;
  
  // Clear reset token fields
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  
  // Clear refresh token for security (force re-login)
  user.refreshToken = null;
  
  await user.save();

  console.log('✅ Password reset successful for:', user.email);

  return {
    success: true,
    message: 'Password has been reset successfully. Please login with your new password.'
  };
};

export default {
  generateResetToken,
  verifyResetToken,
  resetPassword
};
