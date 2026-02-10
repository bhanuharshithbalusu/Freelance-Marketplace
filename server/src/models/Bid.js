/**
 * Bid Model
 * Step 2.3 - Bid Schema
 * 
 * Represents bids placed by FREELANCERS on projects
 * Rules:
 * - One freelancer can place multiple bids on the same project
 * - No bids after project is closed
 */

import mongoose from 'mongoose';
import { PROJECT_STATUS } from './Project.js';

const BID_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN'
};

const bidSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: [true, 'Project ID is required'],
      index: true
    },

    freelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Freelancer ID is required'],
      index: true
    },

    amount: {
      type: Number,
      required: [true, 'Bid amount is required'],
      min: [1, 'Bid amount must be at least 1']
    },

    // Bid proposal/message
    proposal: {
      type: String,
      required: [true, 'Bid proposal is required'],
      trim: true,
      minlength: [50, 'Proposal must be at least 50 characters'],
      maxlength: [2000, 'Proposal cannot exceed 2000 characters']
    },

    // Estimated delivery time (in days)
    deliveryTime: {
      type: Number,
      required: [true, 'Delivery time is required'],
      min: [1, 'Delivery time must be at least 1 day'],
      max: [365, 'Delivery time cannot exceed 365 days']
    },

    // Bid status
    status: {
      type: String,
      enum: {
        values: Object.values(BID_STATUS),
        message: 'Status must be PENDING, ACCEPTED, REJECTED, or WITHDRAWN'
      },
      default: BID_STATUS.PENDING,
      index: true
    },

    // Cover letter attachments (portfolio samples, etc.)
    attachments: [{
      filename: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],

    // When bid was accepted/rejected
    statusUpdatedAt: {
      type: Date,
      default: null
    },

    // Rejection reason (if rejected)
    rejectionReason: {
      type: String,
      maxlength: [500, 'Rejection reason cannot exceed 500 characters'],
      default: null
    },

    // Bid version (for tracking multiple bids from same freelancer)
    version: {
      type: Number,
      default: 1,
      min: 1
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for common queries
bidSchema.index({ projectId: 1, createdAt: -1 });
bidSchema.index({ freelancerId: 1, createdAt: -1 });
bidSchema.index({ projectId: 1, freelancerId: 1 });
bidSchema.index({ projectId: 1, amount: 1 });
bidSchema.index({ status: 1, createdAt: -1 });

// Virtual to check if bid is active
bidSchema.virtual('isActive').get(function () {
  return this.status === BID_STATUS.PENDING;
});

// Pre-save validation: Check if project allows bidding
bidSchema.pre('save', async function (next) {
  // Only validate on new bids
  if (!this.isNew) {
    return next();
  }

  try {
    const Project = mongoose.model('Project');
    const project = await Project.findById(this.projectId);

    if (!project) {
      throw new Error('Project not found');
    }

    // Rule: No bids after project is closed
    if (project.status === PROJECT_STATUS.CLOSED) {
      throw new Error('Cannot bid on a closed project');
    }

    if (project.status === PROJECT_STATUS.ASSIGNED) {
      throw new Error('Cannot bid on an assigned project');
    }

    // Check if bidding period has ended
    if (new Date() >= project.biddingEndsAt) {
      throw new Error('Bidding period has ended for this project');
    }

    // Check if bid amount is within project budget
    if (this.amount < project.budget.min || this.amount > project.budget.max) {
      throw new Error(`Bid amount must be between ${project.budget.min} and ${project.budget.max}`);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Post-save: Update project's lowest bid and total bids
bidSchema.post('save', async function (doc, next) {
  try {
    const Project = mongoose.model('Project');
    const project = await Project.findById(doc.projectId);

    if (project && doc.status === BID_STATUS.PENDING) {
      // Increment total bids
      await project.incrementBidCount();
      
      // Update lowest bid if this is lower
      await project.updateLowestBid(doc.amount);
    }

    next();
  } catch (error) {
    next(error);
  }
});

// Method to accept bid
bidSchema.methods.accept = async function () {
  if (this.status !== BID_STATUS.PENDING) {
    throw new Error('Only pending bids can be accepted');
  }

  this.status = BID_STATUS.ACCEPTED;
  this.statusUpdatedAt = new Date();

  // Update project status
  const Project = mongoose.model('Project');
  const project = await Project.findById(this.projectId);
  
  if (project) {
    await project.assignToFreelancer(this.freelancerId, this._id);
  }

  // Reject all other bids for this project
  await mongoose.model('Bid').updateMany(
    {
      projectId: this.projectId,
      _id: { $ne: this._id },
      status: BID_STATUS.PENDING
    },
    {
      status: BID_STATUS.REJECTED,
      statusUpdatedAt: new Date(),
      rejectionReason: 'Another bid was accepted'
    }
  );

  return this.save();
};

// Method to reject bid
bidSchema.methods.reject = async function (reason = null) {
  if (this.status !== BID_STATUS.PENDING) {
    throw new Error('Only pending bids can be rejected');
  }

  this.status = BID_STATUS.REJECTED;
  this.statusUpdatedAt = new Date();
  this.rejectionReason = reason;

  return this.save();
};

// Method to withdraw bid
bidSchema.methods.withdraw = async function () {
  if (this.status !== BID_STATUS.PENDING) {
    throw new Error('Only pending bids can be withdrawn');
  }

  this.status = BID_STATUS.WITHDRAWN;
  this.statusUpdatedAt = new Date();

  return this.save();
};

// Static method to find bids for a project
bidSchema.statics.findByProject = function (projectId, sortBy = 'amount') {
  const sortOptions = {
    amount: { amount: 1 },
    date: { createdAt: -1 }
  };

  return this.find({ projectId })
    .populate('freelancerId', 'name email avatar skills hourlyRate')
    .sort(sortOptions[sortBy] || sortOptions.amount);
};

// Static method to find bids by freelancer
bidSchema.statics.findByFreelancer = function (freelancerId) {
  return this.find({ freelancerId })
    .populate('projectId', 'title description budget status')
    .sort({ createdAt: -1 });
};

// Static method to count bids for a project
bidSchema.statics.countByProject = function (projectId) {
  return this.countDocuments({ projectId, status: BID_STATUS.PENDING });
};

// Static method to find lowest bid for a project
bidSchema.statics.findLowestBid = function (projectId) {
  return this.findOne({ projectId, status: BID_STATUS.PENDING })
    .sort({ amount: 1 });
};

// Static method to check if freelancer already bid on project
bidSchema.statics.hasFreelancerBid = async function (projectId, freelancerId) {
  const count = await this.countDocuments({ 
    projectId, 
    freelancerId,
    status: BID_STATUS.PENDING 
  });
  return count > 0;
};

// Static method to get bid statistics for a project
bidSchema.statics.getProjectStats = async function (projectId) {
  const stats = await this.aggregate([
    { 
      $match: { 
        projectId: mongoose.Types.ObjectId(projectId),
        status: BID_STATUS.PENDING 
      } 
    },
    {
      $group: {
        _id: null,
        totalBids: { $sum: 1 },
        lowestBid: { $min: '$amount' },
        highestBid: { $max: '$amount' },
        averageBid: { $avg: '$amount' }
      }
    }
  ]);

  return stats[0] || {
    totalBids: 0,
    lowestBid: null,
    highestBid: null,
    averageBid: null
  };
};

const Bid = mongoose.model('Bid', bidSchema);

export default Bid;
export { BID_STATUS };
