/**
 * Request Validation Rules for Authentication
 * Using express-validator with enhanced sanitization
 */

import { body } from 'express-validator';

/**
 * Validation rules for user registration
 */
export const registerValidation = [
  body('name')
    .trim()
    .escape() // Sanitize HTML entities
    .notEmpty().withMessage('Name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail()
    .isLength({ max: 255 }).withMessage('Email is too long'),

  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 6, max: 128 }).withMessage('Password must be between 6 and 128 characters'),

  body('role')
    .trim()
    .notEmpty().withMessage('Role is required')
    .isIn(['CLIENT', 'FREELANCER']).withMessage('Role must be either CLIENT or FREELANCER')
];

/**
 * Validation rules for user login
 */
export const loginValidation = [
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Please provide a valid email')
    .normalizeEmail(),

  body('password')
    .notEmpty().withMessage('Password is required')
];

/**
 * Validation rules for token refresh
 */
export const refreshValidation = [
  body('refreshToken')
    .optional()
    .notEmpty().withMessage('Refresh token cannot be empty')
];

export default {
  registerValidation,
  loginValidation,
  refreshValidation
};
