/**
 * Project Controller
 * Handle HTTP requests for project management
 * Step 4.1 - Project APIs
 */

import asyncHandler from '../middlewares/asyncHandler.js';
import * as projectService from '../services/project.service.js';
import { apiResponse } from '../utils/helpers.js';

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private (CLIENT only)
 */
export const createProject = asyncHandler(async (req, res) => {
  const {
    title,
    description,
    category,
    budget,
    requiredSkills,
    biddingEndsAt
  } = req.body;

  const project = await projectService.createProject(
    {
      title,
      description,
      category,
      budget,
      requiredSkills,
      biddingEndsAt
    },
    req.user.id
  );

  res.status(201).json(
    apiResponse(
      true,
      'Project created successfully',
      { project }
    )
  );
});

/**
 * @route   GET /api/projects
 * @desc    Get all projects with filters
 * @access  Public
 */
export const getProjects = asyncHandler(async (req, res) => {
  const {
    status,
    clientId,
    search,
    minBudget,
    maxBudget,
    skills,
    sortBy,
    sortOrder,
    page,
    limit
  } = req.query;

  const result = await projectService.getProjects(
    {
      status,
      clientId,
      search,
      minBudget,
      maxBudget,
      skills,
      sortBy,
      sortOrder
    },
    { page, limit }
  );

  res.json(
    apiResponse(
      true,
      'Projects retrieved successfully',
      result
    )
  );
});

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Public
 */
export const getProjectById = asyncHandler(async (req, res) => {
  const project = await projectService.getProjectById(req.params.id);

  res.json(
    apiResponse(
      true,
      'Project retrieved successfully',
      { project }
    )
  );
});

/**
 * @route   PATCH /api/projects/:id/close
 * @desc    Close project
 * @access  Private (CLIENT only - owner)
 */
export const closeProject = asyncHandler(async (req, res) => {
  const project = await projectService.closeProject(
    req.params.id,
    req.user.id
  );

  res.json(
    apiResponse(
      true,
      'Project closed successfully',
      { project }
    )
  );
});

/**
 * @route   POST /api/projects/:id/assign
 * @desc    Assign project to freelancer
 * @access  Private (CLIENT only - owner)
 * Step 4.3 - Assign Project API
 */
export const assignProject = asyncHandler(async (req, res) => {
  const { bidId } = req.body;

  const result = await projectService.assignProject(
    req.params.id,
    bidId,
    req.user.id
  );

  res.json(
    apiResponse(
      true,
      'Project assigned successfully',
      result
    )
  );
});

/**
 * @route   GET /api/projects/my-projects
 * @desc    Get my projects (CLIENT only)
 * @access  Private (CLIENT only)
 */
export const getMyProjects = asyncHandler(async (req, res) => {
  const { page, limit } = req.query;

  const result = await projectService.getMyProjects(
    req.user.id,
    { page, limit }
  );

  res.json(
    apiResponse(
      true,
      'My projects retrieved successfully',
      result
    )
  );
});

export default {
  createProject,
  getProjects,
  getProjectById,
  closeProject,
  assignProject,
  getMyProjects
};
