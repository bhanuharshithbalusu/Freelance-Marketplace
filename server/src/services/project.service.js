/**
 * Project Service
 * Business logic for project management
 * Step 4.1 - Project APIs
 * Step 5.2 - Emit Events After DB Updates
 */

import Project from '../models/Project.js';
import Bid from '../models/Bid.js';
import { 
  BadRequestError, 
  NotFoundError,
  ForbiddenError,
  ConflictError 
} from '../utils/errors.js';
import { PROJECT_STATUS } from '../config/constants.js';
import { 
  emitProjectCreated, 
  emitProjectUpdated, 
  emitProjectAssigned,
  emitProjectClosed
} from '../sockets/index.js';

/**
 * Create new project (CLIENT only)
 * @param {Object} projectData - Project details
 * @param {String} clientId - ID of the client creating the project
 * @returns {Object} Created project
 */
export const createProject = async (projectData, clientId) => {
  const {
    title,
    description,
    category,
    budget,
    requiredSkills,
    biddingEndsAt
  } = projectData;

  // Validate budget
  if (budget && budget.min && budget.max) {
    if (budget.min > budget.max) {
      throw new BadRequestError('Minimum budget cannot be greater than maximum budget');
    }
    if (budget.min < 0 || budget.max < 0) {
      throw new BadRequestError('Budget values must be positive');
    }
  }

  // Validate bidding deadline
  const deadline = new Date(biddingEndsAt);
  if (deadline <= new Date()) {
    throw new BadRequestError('Bidding deadline must be in the future');
  }

  // Create project
  const project = await Project.create({
    clientId,
    title,
    description,
    category,
    budget,
    requiredSkills: requiredSkills || [],
    biddingEndsAt: deadline,
    status: PROJECT_STATUS.OPEN
  });

  // Step 5.2: Emit event after successful DB update
  emitProjectCreated(project.toObject());

  return project;
};

/**
 * Get all projects with filters and pagination
 * @param {Object} filters - Filter criteria
 * @param {Object} pagination - Page and limit
 * @returns {Object} { projects, total, page, totalPages }
 */
export const getProjects = async (filters = {}, pagination = {}) => {
  const {
    status,
    clientId,
    search,
    minBudget,
    maxBudget,
    skills,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = filters;

  const {
    page = 1,
    limit = 10
  } = pagination;

  // Build query
  const query = {};

  // Filter by status
  if (status) {
    if (!Object.values(PROJECT_STATUS).includes(status)) {
      throw new BadRequestError(`Invalid status. Must be one of: ${Object.values(PROJECT_STATUS).join(', ')}`);
    }
    query.status = status;
  }

  // Filter by client
  if (clientId) {
    query.clientId = clientId;
  }

  // Search in title and description
  if (search) {
    query.$or = [
      { title: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } }
    ];
  }

  // Filter by budget range
  if (minBudget || maxBudget) {
    query.$and = query.$and || [];
    if (minBudget) {
      query.$and.push({ 'budget.min': { $gte: Number(minBudget) } });
    }
    if (maxBudget) {
      query.$and.push({ 'budget.max': { $lte: Number(maxBudget) } });
    }
  }

  // Filter by required skills
  if (skills) {
    const skillsArray = Array.isArray(skills) ? skills : skills.split(',');
    query.requiredSkills = { $in: skillsArray };
  }

  // Calculate skip
  const skip = (page - 1) * limit;

  // Build sort object
  const sort = {};
  sort[sortBy] = sortOrder === 'asc' ? 1 : -1;

  // Execute query
  const [projects, total] = await Promise.all([
    Project.find(query)
      .populate('clientId', 'name email')
      .populate('assignedFreelancerId', 'name email')
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .lean(),
    Project.countDocuments(query)
  ]);

  // Calculate total pages
  const totalPages = Math.ceil(total / limit);

  return {
    projects,
    pagination: {
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages
    }
  };
};

/**
 * Get single project by ID
 * @param {String} projectId - Project ID
 * @returns {Object} Project with bids
 */
export const getProjectById = async (projectId) => {
  const project = await Project.findById(projectId)
    .populate('clientId', 'name email')
    .populate('assignedFreelancerId', 'name email')
    .lean();

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Get bids for this project
  const bids = await Bid.find({ projectId })
    .populate('freelancerId', 'name email')
    .sort({ amount: 1 }) // Sort by amount ascending (lowest first)
    .lean();

  return {
    ...project,
    bids
  };
};

/**
 * Close project (CLIENT only - owner)
 * @param {String} projectId - Project ID
 * @param {String} clientId - ID of the client closing the project
 * @returns {Object} Updated project
 */
export const closeProject = async (projectId, clientId) => {
  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Verify ownership
  if (project.clientId.toString() !== clientId.toString()) {
    throw new ForbiddenError('You do not have permission to close this project');
  }

  // Check if project is already closed or assigned
  if (project.status === PROJECT_STATUS.CLOSED) {
    throw new ConflictError('Project is already closed');
  }

  if (project.status === PROJECT_STATUS.ASSIGNED) {
    throw new ConflictError('Cannot close an assigned project');
  }

  // Close the project
  await project.closeProject();

  // Step 5.2: Emit event after successful DB update
  emitProjectClosed(project.toObject());

  return project;
};

/**
 * Assign project to a freelancer (CLIENT only - owner)
 * Step 4.3 - Assign Project API
 * @param {String} projectId - Project ID
 * @param {String} bidId - Bid ID to accept
 * @param {String} clientId - ID of the client assigning the project
 * @returns {Object} Updated project and accepted bid
 */
export const assignProject = async (projectId, bidId, clientId) => {
  // Get project
  const project = await Project.findById(projectId);

  if (!project) {
    throw new NotFoundError('Project not found');
  }

  // Verify ownership
  if (project.clientId.toString() !== clientId.toString()) {
    throw new ForbiddenError('You do not have permission to assign this project');
  }

  // Check if project is open
  if (project.status !== PROJECT_STATUS.OPEN) {
    if (project.status === PROJECT_STATUS.ASSIGNED) {
      throw new ConflictError('This project has already been assigned to a freelancer');
    } else if (project.status === PROJECT_STATUS.CLOSED) {
      throw new ConflictError('This project has been closed and cannot be assigned');
    } else {
      throw new ConflictError(`Cannot assign project with status: ${project.status}`);
    }
  }

  // Get the bid
  const bid = await Bid.findById(bidId);

  if (!bid) {
    throw new NotFoundError('Bid not found');
  }

  // Verify bid belongs to this project
  if (bid.projectId.toString() !== projectId.toString()) {
    throw new BadRequestError('Bid does not belong to this project');
  }

  // Check if bid is already accepted or rejected
  if (bid.status === 'ACCEPTED') {
    throw new ConflictError('Bid is already accepted');
  }

  if (bid.status === 'REJECTED') {
    throw new ConflictError('Cannot accept a rejected bid');
  }

  // Accept the bid (this will reject all other bids)
  await bid.accept();

  // Assign project to freelancer
  await project.assignToFreelancer(bid.freelancerId);

  // Reload project with populated data
  const updatedProject = await Project.findById(projectId)
    .populate('clientId', 'name email')
    .populate('assignedFreelancerId', 'name email')
    .lean();

  // Reload bid with populated data
  const updatedBid = await Bid.findById(bidId)
    .populate('freelancerId', 'name email')
    .lean();

  const result = {
    project: updatedProject,
    acceptedBid: updatedBid
  };

  // Step 5.2: Emit event after successful DB update
  emitProjectAssigned(result);

  return result;
};

/**
 * Get my projects (CLIENT only)
 * @param {String} clientId - Client ID
 * @param {Object} pagination - Page and limit
 * @param {Object} { projects, total, page, totalPages }
 */
export const getMyProjects = async (clientId, pagination = {}) => {
  return getProjects({ clientId }, pagination);
};

export default {
  createProject,
  getProjects,
  getProjectById,
  closeProject,
  assignProject,
  getMyProjects
};
