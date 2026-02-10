/**
 * Dashboard Service
 * Analytics and statistics for users
 */

import Project from '../models/Project.js';
import Bid from '../models/Bid.js';
import User from '../models/User.js';

// Use status strings directly since Project model has its own enum
const PROJECT_STATUS = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  CLOSED: 'CLOSED'
};

/**
 * Get client dashboard statistics
 * @param {String} clientId - Client user ID
 * @returns {Object} Dashboard data
 */
export const getClientDashboard = async (clientId) => {
  // Get all projects for this client
  const projects = await Project.find({ clientId });
  
  // Calculate statistics
  const totalProjects = projects.length;
  const openProjects = projects.filter(p => p.status === PROJECT_STATUS.OPEN).length;
  const assignedProjects = projects.filter(p => p.status === PROJECT_STATUS.ASSIGNED).length;
  const closedProjects = projects.filter(p => p.status === PROJECT_STATUS.CLOSED).length;
  
  // Calculate total budget and spent
  // ONLY count budget and spent for ASSIGNED projects (where freelancer was hired)
  let totalBudgetMax = 0;
  let totalSpent = 0;
  
  for (const project of projects) {
    // Only include budget.max for ASSIGNED projects
    if (project.status === PROJECT_STATUS.ASSIGNED) {
      totalBudgetMax += project.budget.max;
      
      // Get the accepted bid amount
      const acceptedBid = await Bid.findById(project.assignedBidId);
      if (acceptedBid) {
        totalSpent += acceptedBid.amount;
      }
    }
  }
  
  // Get total bids received
  const projectIds = projects.map(p => p._id);
  const totalBids = await Bid.countDocuments({ projectId: { $in: projectIds } });
  
  // Get average bid amount
  const bids = await Bid.find({ projectId: { $in: projectIds } });
  const avgBidAmount = bids.length > 0 
    ? bids.reduce((sum, bid) => sum + bid.amount, 0) / bids.length 
    : 0;
  
  // Get recent activity (last 10 bids and project updates)
  const recentBids = await Bid.find({ projectId: { $in: projectIds } })
    .sort({ createdAt: -1 })
    .limit(10)
    .populate('freelancerId', 'name email')
    .populate('projectId', 'title')
    .lean();
  
  // Get projects by category
  const projectsByCategory = {};
  projects.forEach(project => {
    const category = project.category || 'Other';
    projectsByCategory[category] = (projectsByCategory[category] || 0) + 1;
  });
  
  // Get monthly project creation trend (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyProjects = await Project.aggregate([
    {
      $match: {
        clientId: clientId,
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
  
  return {
    statistics: {
      totalProjects,
      openProjects,
      assignedProjects,
      closedProjects,
      totalBids,
      avgBidAmount: Math.round(avgBidAmount),
      totalBudgetMax,
      totalSpent,
      moneySaved: totalBudgetMax - totalSpent
    },
    recentActivity: recentBids.map(bid => ({
      type: 'bid',
      bidId: bid._id,
      amount: bid.amount,
      status: bid.status,
      freelancer: bid.freelancerId,
      project: bid.projectId,
      createdAt: bid.createdAt
    })),
    projectsByCategory,
    monthlyTrend: monthlyProjects
  };
};

/**
 * Get freelancer dashboard statistics
 * @param {String} freelancerId - Freelancer user ID
 * @returns {Object} Dashboard data
 */
export const getFreelancerDashboard = async (freelancerId) => {
  // Get all bids for this freelancer with populated project and client data
  const bids = await Bid.find({ freelancerId })
    .populate({
      path: 'projectId',
      select: 'title status clientId budget',
      populate: {
        path: 'clientId',
        select: 'name email'
      }
    })
    .lean();
  
  // Calculate statistics
  const totalBids = bids.length;
  const acceptedBids = bids.filter(b => b.status === 'ACCEPTED').length;
  const rejectedBids = bids.filter(b => b.status === 'REJECTED').length;
  const pendingBids = bids.filter(b => b.status === 'PENDING').length;
  
  // Calculate win rate
  const winRate = totalBids > 0 ? (acceptedBids / totalBids) * 100 : 0;
  
  // Calculate total earnings (from accepted bids)
  const totalEarnings = bids
    .filter(b => b.status === 'ACCEPTED')
    .reduce((sum, bid) => sum + bid.amount, 0);
  
  // Calculate average bid amount
  const avgBidAmount = totalBids > 0
    ? bids.reduce((sum, bid) => sum + bid.amount, 0) / totalBids
    : 0;
  
  // Get active projects (where bids are accepted)
  const activeProjects = bids.filter(b => 
    b.status === 'ACCEPTED' && 
    b.projectId && 
    b.projectId.status === PROJECT_STATUS.ASSIGNED
  );
  
  // Get completed projects
  const completedProjects = bids.filter(b =>
    b.status === 'ACCEPTED' &&
    b.projectId &&
    b.projectId.status === PROJECT_STATUS.CLOSED
  );
  
  // Get recent activity
  const recentActivity = bids
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10)
    .map(bid => ({
      type: 'bid',
      bidId: bid._id,
      amount: bid.amount,
      status: bid.status,
      project: bid.projectId,
      createdAt: bid.createdAt,
      updatedAt: bid.updatedAt
    }));
  
  // Get bids by status over time (last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const monthlyBids = await Bid.aggregate([
    {
      $match: {
        freelancerId: freelancerId,
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' },
          status: '$status'
        },
        count: { $sum: 1 },
        totalAmount: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
  
  // Get earnings by month
  const monthlyEarnings = await Bid.aggregate([
    {
      $match: {
        freelancerId: freelancerId,
        status: 'ACCEPTED',
        createdAt: { $gte: sixMonthsAgo }
      }
    },
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        earnings: { $sum: '$amount' }
      }
    },
    {
      $sort: { '_id.year': 1, '_id.month': 1 }
    }
  ]);
  
  // Format monthly data with proper month names
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  // Create a map for monthly bids
  const bidsByMonth = {};
  monthlyBids.forEach(item => {
    const monthKey = `${monthNames[item._id.month - 1]} ${item._id.year}`;
    bidsByMonth[monthKey] = item.count;
  });
  
  // Create a map for monthly earnings
  const earningsByMonth = {};
  monthlyEarnings.forEach(item => {
    const monthKey = `${monthNames[item._id.month - 1]} ${item._id.year}`;
    earningsByMonth[monthKey] = item.earnings;
  });
  
  // Generate last 6 months data
  const last6Months = [];
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthKey = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    last6Months.push({
      month: monthKey,
      bids: bidsByMonth[monthKey] || 0,
      earnings: earningsByMonth[monthKey] || 0
    });
  }
  
  return {
    stats: {
      totalBids,
      acceptedBids,
      rejectedBids,
      pendingBids,
      winRate: Math.round(winRate * 10) / 10, // Round to 1 decimal
      totalEarnings,
      avgBidAmount: Math.round(avgBidAmount),
      activeProjects: activeProjects.length,
      completedProjects: completedProjects.length
    },
    activeProjects: activeProjects.map(bid => ({
      id: bid.projectId._id,
      title: bid.projectId.title,
      budget: bid.amount,
      status: bid.projectId.status,
      Client: {
        name: bid.projectId.clientId?.name || 'Unknown Client'
      }
    })),
    monthlyBids: last6Months.map(m => ({ month: m.month, bids: m.bids })),
    monthlyEarnings: last6Months.map(m => ({ month: m.month, earnings: m.earnings }))
  };
};

export default {
  getClientDashboard,
  getFreelancerDashboard
};
