/**
 * Bid Routes
 * Step 4.2 - Bidding API
 * Step 8 - Enhanced with validation & rate limiting
 * 
 * POST   /api/projects/:projectId/bids  - Submit bid (FREELANCER only)
 * GET    /api/bids                       - Get all bids (private)
 * GET    /api/bids/:id                   - Get single bid (private)
 * PATCH  /api/bids/:id                   - Update bid (FREELANCER only - owner)
 * DELETE /api/bids/:id                   - Withdraw bid (FREELANCER only - owner)
 * GET    /api/bids/my-bids               - Get my bids (FREELANCER only)
 * GET    /api/projects/:projectId/bids   - Get project bids (private)
 */

import express from 'express';
import * as bidController from '../controllers/bid.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { freelancerOnly, anyAuthenticated } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import {
  submitBidValidation,
  bidIdValidation,
  updateBidValidation,
  bidQueryValidation
} from '../middlewares/bidValidation.js';
import {
  bidSubmissionLimiter,
  bidUpdateLimiter,
  userBidLimiter,
  searchLimiter
} from '../middlewares/rateLimiter.js';
import {
  sanitizeBody,
  sanitizeQuery,
  preventNoSQLInjection
} from '../middlewares/sanitization.js';

const router = express.Router();

/**
 * @route   GET /api/bids/my-bids
 * @desc    Get my bids
 * @access  Private (FREELANCER only)
 * NOTE: This must be before /:id route to avoid conflicts
 */
router.get(
  '/my-bids',
  authenticate,
  freelancerOnly,
  bidController.getMyBids
);

/**
 * @route   POST /api/projects/:projectId/bids
 * @desc    Submit bid on project
 * @access  Private (FREELANCER only)
 * Step 4.2 - Bidding API
 */
router.post(
  '/projects/:projectId/bids',
  authenticate,
  freelancerOnly,
  bidSubmissionLimiter,
  userBidLimiter,
  sanitizeBody,
  preventNoSQLInjection,
  submitBidValidation,
  validate,
  bidController.submitBid
);

/**
 * @route   GET /api/projects/:projectId/bids
 * @desc    Get all bids for a project
 * @access  Private (any authenticated user)
 */
router.get(
  '/projects/:projectId/bids',
  authenticate,
  anyAuthenticated,
  sanitizeQuery,
  preventNoSQLInjection,
  bidController.getProjectBids
);

/**
 * @route   GET /api/bids
 * @desc    Get all bids with filters
 * @access  Private (any authenticated user)
 */
router.get(
  '/',
  authenticate,
  anyAuthenticated,
  searchLimiter,
  sanitizeQuery,
  preventNoSQLInjection,
  bidQueryValidation,
  validate,
  bidController.getBids
);

/**
 * @route   GET /api/bids/:id
 * @desc    Get single bid by ID
 * @access  Private (any authenticated user)
 */
router.get(
  '/:id',
  authenticate,
  anyAuthenticated,
  bidIdValidation,
  validate,
  bidController.getBidById
);

/**
 * @route   PATCH /api/bids/:id
 * @desc    Update bid amount
 * @access  Private (FREELANCER only - owner)
 */
router.patch(
  '/:id',
  authenticate,
  freelancerOnly,
  bidUpdateLimiter,
  sanitizeBody,
  preventNoSQLInjection,
  updateBidValidation,
  validate,
  bidController.updateBid
);

/**
 * @route   DELETE /api/bids/:id
 * @desc    Withdraw bid
 * @access  Private (FREELANCER only - owner)
 */
router.delete(
  '/:id',
  authenticate,
  freelancerOnly,
  bidIdValidation,
  validate,
  bidController.withdrawBid
);

export default router;
