/**
 * Project Routes
 * Step 4.1 - Project APIs
 * Step 4.3 - Assign Project API
 * Step 8 - Enhanced with validation & rate limiting
 * 
 * POST   /api/projects              - Create project (CLIENT only)
 * GET    /api/projects              - Get all projects (public)
 * GET    /api/projects/:id          - Get single project (public)
 * PATCH  /api/projects/:id/close    - Close project (CLIENT only - owner)
 * POST   /api/projects/:id/assign   - Assign project (CLIENT only - owner)
 * GET    /api/projects/my-projects  - Get my projects (CLIENT only)
 */

import express from 'express';
import * as projectController from '../controllers/project.controller.js';
import { authenticate, optionalAuth } from '../middlewares/auth.js';
import { clientOnly } from '../middlewares/authorize.js';
import { validate } from '../middlewares/validate.js';
import {
  createProjectValidation,
  projectIdValidation,
  projectQueryValidation,
  assignProjectValidation
} from '../middlewares/projectValidation.js';
import {
  projectCreationLimiter,
  userProjectLimiter,
  searchLimiter
} from '../middlewares/rateLimiter.js';
import {
  sanitizeBody,
  sanitizeQuery,
  preventNoSQLInjection
} from '../middlewares/sanitization.js';

const router = express.Router();

/**
 * @route   GET /api/projects/my-projects
 * @desc    Get my projects
 * @access  Private (CLIENT only)
 * NOTE: This must be before /:id route to avoid conflicts
 */
router.get(
  '/my-projects',
  authenticate,
  clientOnly,
  projectController.getMyProjects
);

/**
 * @route   POST /api/projects
 * @desc    Create new project
 * @access  Private (CLIENT only)
 */
router.post(
  '/',
  authenticate,
  clientOnly,
  projectCreationLimiter,
  userProjectLimiter,
  sanitizeBody,
  preventNoSQLInjection,
  createProjectValidation,
  validate,
  projectController.createProject
);

/**
 * @route   GET /api/projects
 * @desc    Get all projects with filters
 * @access  Public (but can show user-specific data if authenticated)
 */
router.get(
  '/',
  optionalAuth,
  searchLimiter,
  sanitizeQuery,
  preventNoSQLInjection,
  projectQueryValidation,
  validate,
  projectController.getProjects
);

/**
 * @route   GET /api/projects/:id
 * @desc    Get single project by ID
 * @access  Public
 */
router.get(
  '/:id',
  optionalAuth,
  projectIdValidation,
  validate,
  projectController.getProjectById
);

/**
 * @route   PATCH /api/projects/:id/close
 * @desc    Close project
 * @access  Private (CLIENT only - owner)
 */
router.patch(
  '/:id/close',
  authenticate,
  clientOnly,
  projectIdValidation,
  validate,
  projectController.closeProject
);

/**
 * @route   POST /api/projects/:id/assign
 * @desc    Assign project to freelancer
 * @access  Private (CLIENT only - owner)
 * Step 4.3 - Assign Project API
 */
router.post(
  '/:id/assign',
  authenticate,
  clientOnly,
  assignProjectValidation,
  validate,
  projectController.assignProject
);

export default router;
