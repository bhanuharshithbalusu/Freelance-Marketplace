/**
 * Password Reset Controller
 * Handle HTTP requests for password reset
 */

import asyncHandler from '../middlewares/asyncHandler.js';
import * as passwordResetService from '../services/passwordReset.service.js';
import { apiResponse } from '../utils/helpers.js';

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Request password reset
 * @access  Public
 */
export const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;

  const result = await passwordResetService.generateResetToken(email);

  // In development, include the token in response
  // In production, this would only send an email
  res.status(200).json(
    apiResponse(
      true,
      result.message,
      process.env.NODE_ENV === 'development' 
        ? { 
            resetToken: result.resetToken,
            // For development: construct reset URL
            resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${result.resetToken}`
          }
        : undefined
    )
  );
});

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset password with token
 * @access  Public
 */
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  const result = await passwordResetService.resetPassword(token, password);

  res.status(200).json(
    apiResponse(true, result.message)
  );
});

/**
 * @route   GET /api/auth/verify-reset-token/:token
 * @desc    Verify if reset token is valid
 * @access  Public
 */
export const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  const user = await passwordResetService.verifyResetToken(token);

  res.status(200).json(
    apiResponse(
      true,
      'Token is valid',
      {
        email: user.email,
        name: user.name
      }
    )
  );
});

export default {
  forgotPassword,
  resetPassword,
  verifyResetToken
};
