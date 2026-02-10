/**
 * Bid Controller
 * Handle HTTP requests for bidding system
 * Step 4.2 - Bidding API
 */

import asyncHandler from '../middlewares/asyncHandler.js';
import * as bidService from '../services/bid.service.js';
import { apiResponse } from '../utils/helpers.js';

/**
 * @route   POST /api/projects/:projectId/bids
 * @desc    Submit bid on project
 * @access  Private (FREELANCER only)
 * Step 4.2 - Bidding API
 */
export const submitBid = asyncHandler(async (req, res) => {
  const { amount, proposal, deliveryTime } = req.body;
  const { projectId } = req.params;

  const bid = await bidService.submitBid(
    projectId,
    amount,
    proposal,
    deliveryTime,
    req.user.id
  );

  res.status(201).json(
    apiResponse(
      true,
      'Bid submitted successfully',
      { bid }
    )
  );
});

/**
 * @route   GET /api/bids
 * @desc    Get all bids with filters
 * @access  Private
 */
export const getBids = asyncHandler(async (req, res) => {
  const {
    projectId,
    freelancerId,
    status,
    minAmount,
    maxAmount,
    sortBy,
    sortOrder,
    page,
    limit
  } = req.query;

  const result = await bidService.getBids(
    {
      projectId,
      freelancerId,
      status,
      minAmount,
      maxAmount,
      sortBy,
      sortOrder
    },
    { page, limit }
  );

  res.json(
    apiResponse(
      true,
      'Bids retrieved successfully',
      result
    )
  );
});

/**
 * @route   GET /api/bids/:id
 * @desc    Get single bid by ID
 * @access  Private
 */
export const getBidById = asyncHandler(async (req, res) => {
  const bid = await bidService.getBidById(req.params.id);

  res.json(
    apiResponse(
      true,
      'Bid retrieved successfully',
      { bid }
    )
  );
});

/**
 * @route   PATCH /api/bids/:id
 * @desc    Update bid amount
 * @access  Private (FREELANCER only - owner)
 */
export const updateBid = asyncHandler(async (req, res) => {
  const { amount } = req.body;

  const bid = await bidService.updateBid(
    req.params.id,
    amount,
    req.user.id
  );

  res.json(
    apiResponse(
      true,
      'Bid updated successfully',
      { bid }
    )
  );
});

/**
 * @route   DELETE /api/bids/:id
 * @desc    Withdraw bid
 * @access  Private (FREELANCER only - owner)
 */
export const withdrawBid = asyncHandler(async (req, res) => {
  const result = await bidService.withdrawBid(
    req.params.id,
    req.user.id
  );

  res.json(
    apiResponse(
      true,
      result.message
    )
  );
});

/**
 * @route   GET /api/bids/my-bids
 * @desc    Get my bids
 * @access  Private (FREELANCER only)
 */
export const getMyBids = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await bidService.getMyBids(
    req.user.id,
    { page, limit }
  );

  res.json(
    apiResponse(
      true,
      'My bids retrieved successfully',
      result
    )
  );
});

/**
 * @route   GET /api/projects/:projectId/bids
 * @desc    Get all bids for a project
 * @access  Private
 */
export const getProjectBids = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await bidService.getProjectBids(
    req.params.projectId,
    { page, limit }
  );

  res.json(
    apiResponse(
      true,
      'Project bids retrieved successfully',
      result
    )
  );
});

export default {
  submitBid,
  getBids,
  getBidById,
  updateBid,
  withdrawBid,
  getMyBids,
  getProjectBids
};
