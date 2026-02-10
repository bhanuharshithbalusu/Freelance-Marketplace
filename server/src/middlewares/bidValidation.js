/**
 * Request Validation Rules for Bids
 * Using express-validator
 */

import { body, param, query } from 'express-validator';

/**
 * Validation rules for submitting a bid
 */
export const submitBidValidation = [
  param('projectId')
    .isMongoId().withMessage('Invalid project ID'),

  body('amount')
    .notEmpty().withMessage('Bid amount is required')
    .isFloat({ min: 1, max: 10000000 }).withMessage('Bid amount must be between $1 and $10,000,000')
    .toFloat(),

  body('proposal')
    .trim()
    .notEmpty().withMessage('Proposal is required')
    .isLength({ min: 50, max: 2000 }).withMessage('Proposal must be between 50 and 2000 characters')
    .customSanitizer(value => {
      // Remove dangerous HTML but allow basic text
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                  .trim();
    }),

  body('deliveryTime')
    .notEmpty().withMessage('Delivery time is required')
    .isInt({ min: 1, max: 365 }).withMessage('Delivery time must be between 1 and 365 days')
    .toInt()
];

/**
 * Validation rules for bid ID param
 */
export const bidIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid bid ID')
];

/**
 * Validation rules for updating bid
 */
export const updateBidValidation = [
  param('id')
    .isMongoId().withMessage('Invalid bid ID'),

  body('amount')
    .notEmpty().withMessage('Bid amount is required')
    .isFloat({ min: 1, max: 10000000 }).withMessage('Bid amount must be between $1 and $10,000,000')
    .toFloat(),

  body('proposal')
    .optional()
    .trim()
    .isLength({ min: 50, max: 2000 }).withMessage('Proposal must be between 50 and 2000 characters')
    .customSanitizer(value => {
      if (!value) return value;
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                  .trim();
    })
];

/**
 * Validation rules for bid query filters
 */
export const bidQueryValidation = [
  query('projectId')
    .optional()
    .isMongoId().withMessage('Invalid project ID'),

  query('freelancerId')
    .optional()
    .isMongoId().withMessage('Invalid freelancer ID'),

  query('status')
    .optional()
    .isIn(['PENDING', 'ACCEPTED', 'REJECTED']).withMessage('Status must be PENDING, ACCEPTED, or REJECTED'),

  query('minAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum amount must be a positive number'),

  query('maxAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum amount must be a positive number'),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'amount', 'status']).withMessage('Invalid sort field'),

  query('sortOrder')
    .optional()
    .isIn(['asc', 'desc']).withMessage('Sort order must be asc or desc'),

  query('page')
    .optional()
    .isInt({ min: 1 }).withMessage('Page must be a positive integer'),

  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100')
];

export default {
  submitBidValidation,
  bidIdValidation,
  updateBidValidation,
  bidQueryValidation
};
