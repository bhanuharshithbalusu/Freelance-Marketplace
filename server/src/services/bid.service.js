/**
 * Bid Service
 * Business logic for bidding system
 * Step 4.2 - Bidding API
 * Step 5.2 - Emit Events After DB Updates
 */

import Bid from '../models/Bid.js';
import Project from '../models/Project.js';
import { 
  BadRequestError, 
  NotFoundError,
  ForbiddenError,
  ConflictError 
} from '../utils/errors.js';
import { PROJECT_STATUS } from '../config/constants.js';
import { 
  emitBidSubmitted, 
  emitBidUpdated, 
  emitBidWithdrawn 
} from '../sockets/index.js';

/**
 * Submit bid on project (FREELANCER only)
 * Step 4.2 - Bidding API with validation rules
 * @param {String} projectId - Project ID
 * @param {Number} amount - Bid amount
 * @param {String} proposal - Bid proposal text
 * @param {Number} deliveryTime - Estimated delivery time in days
 * @param {String} freelancerId - Freelancer ID
 * @returns {Object} Created bid
 */
export const submitBid = async (projectId, amount, proposal, deliveryTime, freelancerId) => {
  // Get project
  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Validation Rule 1: Project must be OPEN
  if (project.status !== PROJECT_STATUS.OPEN) {
    throw new ConflictError(`Cannot bid on project with status: ${project.status}. Project must be OPEN.`);
  }

  // Validation Rule 2: Bidding must not be expired
  if (new Date() > project.biddingEndsAt) {
    throw new ConflictError('Bidding deadline has passed');
  }

  // Validation Rule 3: Bid must be lower than current lowestBid (if exists)
  if (project.lowestBid && amount >= project.lowestBid) {
    throw new BadRequestError(
      `Bid amount must be lower than current lowest bid ($${project.lowestBid}). Your bid: $${amount}`
    );
  }

  // Additional validation: Bid must be within budget range
  if (project.budget) {
    if (project.budget.min && amount < project.budget.min) {
      throw new BadRequestError(
        `Bid amount must be at least $${project.budget.min}`
      );
    }
    if (project.budget.max && amount > project.budget.max) {
      throw new BadRequestError(
        `Bid amount must not exceed $${project.budget.max}`
      );
    }
  }

  // Prevent client from bidding on their own project
  if (project.clientId.toString() === freelancerId.toString()) {
    throw new ForbiddenError('You cannot bid on your own project');
  }

  // Check if freelancer already has a bid on this project
  const existingBid = await Bid.findOne({ 
    projectId, 
    freelancerId 
  });

  if (existingBid) {
    // Update existing bid with new data
    existingBid.amount = amount;
    existingBid.proposal = proposal;
    existingBid.deliveryTime = deliveryTime;
    await existingBid.save();
    
    // Populate and emit update event
    await existingBid.populate('freelancerId', 'name email');
    emitBidUpdated(existingBid.toObject());
    
    return existingBid;
  }

  // Create new bid
  console.log('Creating bid with data:', {
    projectId,
    freelancerId,
    amount,
    proposal,
    deliveryTime,
    proposalType: typeof proposal,
    deliveryTimeType: typeof deliveryTime
  });
  
  const bid = await Bid.create({
    projectId,
    freelancerId,
    amount,
    proposal,
    deliveryTime
  });

  // Populate freelancer data
  await bid.populate('freelancerId', 'name email');

  // Step 5.2: Emit event after successful DB update
  emitBidSubmitted(bid.toObject());

  return bid;
};

/**
 * Get all bids with filters
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Page and limit
 * @returns {Object} { bids, total, page, totalPages }
 */
export const getBids = async (filters = {}, pagination = {}) => {
  const {
    projectId,
    freelancerId,
    status,
    minAmount,
    maxAmount,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const {
    page = 1,
    limit = 10
  } = pagination;

  // Build query
  const query = {};

  if (projectId) {
    query.projectId = projectId;
  }

  if (freelancerId) {
    query.freelancerId = freelancerId;
  }

  if (status) {
    query.status = status;
  }

  if (minAmount) {
    query.amount = { ...query.amount, $gte: Number(minAmount) };
  }

  if (maxAmount) {
    query.amount = { ...query.amount, $lte: Number(maxAmount) };
  }

  // Calculate skip
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const [bids, total] = await Promise.all([
    Bid.find(query)
      .populate('freelancerId', 'name email')
      .populate('projectId', 'title status')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Bid.countDocuments(query)
  ]);

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  return {
    bids,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages
    }
  };
};

/**
 * Get single bid by ID
 * @param {String} bidId - Bid ID
 * @returns {Object} Bid
 */
export const getBidById = async (bidId) => {
  const bid = await Bid.findById(bidId)
    .populate('freelancerId', 'name email')
    .populate('projectId', 'title status clientId')
    .lean();

  if (!bid) {
    throw new NotFoundError('Bid not found');
  }

  return bid;
};

/**
 * Update bid amount (FREELANCER only - owner)
 * @param {String} bidId - Bid ID
 * @param {Number} newAmount - New bid amount
 * @param {String} freelancerId - Freelancer ID
 * @returns {Object} Updated bid
 */
export const updateBid = async (bidId, newAmount, freelancerId) => {
  const bid = await Bid.findById(bidId);

  if (!bid) {
    throw new NotFoundError('Bid not found');
  }

  // Verify ownership
  if (bid.freelancerId.toString() !== freelancerId.toString()) {
    throw new ForbiddenError('You do not have permission to update this bid');
  }

  // Check if bid is already accepted or rejected
  if (bid.status === 'ACCEPTED') {
    throw new ConflictError('Cannot update an accepted bid');
  }

  if (bid.status === 'REJECTED') {
    throw new ConflictError('Cannot update a rejected bid');
  }

  // Get project to validate new amount
  const project = await Project.findById(bid.projectId);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Validate project is still open
  if (project.status !== PROJECT_STATUS.OPEN) {
    throw new ConflictError('Cannot update bid on a closed or assigned project');
  }

  // Validate deadline
  if (new Date() > project.biddingEndsAt) {
    throw new ConflictError('Bidding deadline has passed');
  }

  // Validate new amount against budget
  if (project.budget) {
    if (project.budget.min && newAmount < project.budget.min) {
      throw new BadRequestError(
        `Bid amount must be at least $${project.budget.min}`
      );
    }
    if (project.budget.max && newAmount > project.budget.max) {
      throw new BadRequestError(
        `Bid amount must not exceed $${project.budget.max}`
      );
    }
  }

  // Update bid amount
  bid.amount = newAmount;
  await bid.save();

  // Populate data
  await bid.populate('freelancerId', 'name email');
  await bid.populate('projectId', 'title status');

  // Step 5.2: Emit event after successful DB update
  emitBidUpdated(bid.toObject());

  return bid;
};

/**
 * Withdraw bid (FREELANCER only - owner)
 * @param {String} bidId - Bid ID
 * @param {String} freelancerId - Freelancer ID
 * @returns {Object} Withdrawn bid
 */
export const withdrawBid = async (bidId, freelancerId) => {
  const bid = await Bid.findById(bidId);

  if (!bid) {
    throw new NotFoundError('Bid not found');
  }

  // Verify ownership
  if (bid.freelancerId.toString() !== freelancerId.toString()) {
    throw new ForbiddenError('You do not have permission to withdraw this bid');
  }

  // Check if bid is already accepted
  if (bid.status === 'ACCEPTED') {
    throw new ConflictError('Cannot withdraw an accepted bid');
  }

  // Store project ID before deletion
  const projectId = bid.projectId.toString();

  // Withdraw bid (delete it)
  await bid.withdraw();

  // Step 5.2: Emit event after successful DB update
  emitBidWithdrawn(bidId, projectId);

  return { message: 'Bid withdrawn successfully' };
};

/**
 * Get my bids (FREELANCER only)
 * @param {String} freelancerId - Freelancer ID
 * @param {Object} pagination - Page and limit
 * @returns {Object} { bids, total, page, totalPages }
 */
export const getMyBids = async (freelancerId, pagination = {}) => {
  return getBids({ freelancerId }, pagination);
};

/**
 * Get bids for a project
 * @param {String} projectId - Project ID
 * @param {Object} pagination - Page and limit
 * @returns {Object} { bids, total, page, totalPages }
 */
export const getProjectBids = async (projectId, pagination = {}) => {
  return getBids({ projectId, sortBy: 'amount', sortOrder: 'asc' }, pagination);
};

export default {
  submitBid,
  getBids,
  getBidById,
  updateBid,
  withdrawBid,
  getMyBids,
  getProjectBids
};
