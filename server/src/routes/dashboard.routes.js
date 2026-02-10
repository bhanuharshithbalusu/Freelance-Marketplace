/**
 * Dashboard Routes
 * /api/dashboard
 */

import express from 'express';
import * as dashboardController from '../controllers/dashboard.controller.js';
import { authenticate } from '../middlewares/auth.js';

const router = express.Router();

/**
 * @route   GET /api/dashboard
 * @desc    Get dashboard analytics (client or freelancer based on role)
 * @access  Private
 */
router.get('/', authenticate, dashboardController.getDashboard);

export default router;
