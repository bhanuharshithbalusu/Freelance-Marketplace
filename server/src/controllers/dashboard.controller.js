/**
 * Dashboard Controller
 * Handles dashboard analytics requests
 */

import * as dashboardService from '../services/dashboard.service.js';
import mongoose from 'mongoose';

/**
 * Get dashboard data based on user role
 * GET /api/dashboard
 */
export const getDashboard = async (req, res, next) => {
  try {
    const userId = new mongoose.Types.ObjectId(req.user.id);
    const userRole = req.user.role;
    
    let dashboardData;
    
    if (userRole === 'CLIENT') {
      dashboardData = await dashboardService.getClientDashboard(userId);
    } else if (userRole === 'FREELANCER') {
      dashboardData = await dashboardService.getFreelancerDashboard(userId);
    } else {
      throw new Error('Invalid user role');
    }
    
    res.json({
      success: true,
      data: dashboardData,
      message: 'Dashboard data retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getDashboard
};
