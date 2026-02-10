/**
 * Request Validation Rules for Projects
 * Using express-validator
 */

import { body, param, query } from 'express-validator';
import { PROJECT_STATUS } from '../config/constants.js';

/**
 * Validation rules for creating a project
 */
export const createProjectValidation = [
  body('title')
    .trim()
    .escape() // Sanitize HTML
    .notEmpty().withMessage('Title is required')
    .isLength({ min: 5, max: 200 }).withMessage('Title must be between 5 and 200 characters')
    .matches(/^[a-zA-Z0-9\s\-,.!?()&]+$/).withMessage('Title contains invalid characters'),

  body('description')
    .trim()
    .notEmpty().withMessage('Description is required')
    .isLength({ min: 20, max: 5000 }).withMessage('Description must be between 20 and 5000 characters')
    .customSanitizer(value => {
      // Remove potentially dangerous HTML but allow basic formatting
      return value.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
                  .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
                  .trim();
    }),

  body('budget')
    .optional()
    .isObject().withMessage('Budget must be an object'),

  body('budget.min')
    .optional()
    .isFloat({ min: 0, max: 10000000 }).withMessage('Minimum budget must be between 0 and 10,000,000')
    .toFloat(),

  body('budget.max')
    .optional()
    .isFloat({ min: 0, max: 10000000 }).withMessage('Maximum budget must be between 0 and 10,000,000')
    .toFloat()
    .custom((value, { req }) => {
      if (req.body.budget && req.body.budget.min && value < req.body.budget.min) {
        throw new Error('Maximum budget must be greater than minimum budget');
      }
      return true;
    }),

  body('skillsRequired')
    .optional()
    .isArray({ min: 1, max: 20 }).withMessage('Skills must be an array with 1-20 items'),

  body('skillsRequired.*')
    .optional()
    .trim()
    .escape()
    .isString().withMessage('Each skill must be a string')
    .isLength({ min: 1, max: 50 }).withMessage('Each skill must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s\-+#.]+$/).withMessage('Skills can only contain letters, numbers, and basic symbols'),

  body('category')
    .notEmpty().withMessage('Category is required')
    .isIn([
      'Web Development',
      'Mobile Development',
      'Design',
      'Writing',
      'Marketing',
      'Data Entry',
      'Video & Animation',
      'Music & Audio',
      'Programming',
      'Business',
      'Other'
    ]).withMessage('Invalid category'),

  body('biddingEndsAt')
    .notEmpty().withMessage('Bidding deadline is required')
    .isISO8601().withMessage('Bidding deadline must be a valid date')
    .custom((value) => {
      const deadline = new Date(value);
      const now = new Date();
      const minDeadline = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      const maxDeadline = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year from now
      
      if (deadline < minDeadline) {
        throw new Error('Bidding deadline must be at least 24 hours in the future');
      }
      
      if (deadline > maxDeadline) {
        throw new Error('Bidding deadline cannot be more than 1 year in the future');
      }
      
      return true;
    })
];

/**
 * Validation rules for project ID param
 */
export const projectIdValidation = [
  param('id')
    .isMongoId().withMessage('Invalid project ID')
];

/**
 * Validation rules for project query filters
 */
export const projectQueryValidation = [
  query('status')
    .optional()
    .isIn(Object.values(PROJECT_STATUS)).withMessage(`Status must be one of: ${Object.values(PROJECT_STATUS).join(', ')}`),

  query('clientId')
    .optional()
    .isMongoId().withMessage('Invalid client ID'),

  query('search')
    .optional()
    .trim()
    .isString().withMessage('Search must be a string'),

  query('minBudget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Minimum budget must be a positive number'),

  query('maxBudget')
    .optional()
    .isFloat({ min: 0 }).withMessage('Maximum budget must be a positive number'),

  query('skills')
    .optional()
    .trim(),

  query('sortBy')
    .optional()
    .isIn(['createdAt', 'biddingEndsAt', 'lowestBid', 'totalBids']).withMessage('Invalid sort field'),

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

/**
 * Validation rules for assigning project
 */
export const assignProjectValidation = [
  param('id')
    .isMongoId().withMessage('Invalid project ID'),

  body('bidId')
    .notEmpty().withMessage('Bid ID is required')
    .isMongoId().withMessage('Invalid bid ID')
];

export default {
  createProjectValidation,
  projectIdValidation,
  projectQueryValidation,
  assignProjectValidation
};
