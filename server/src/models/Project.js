/**
 * Project Model
 * Step 2.2 - Project Schema
 * 
 * Represents projects posted by CLIENTS
 * Projects can be OPEN, ASSIGNED, or CLOSED
 */

import mongoose from 'mongoose';

const PROJECT_STATUS = {
  OPEN: 'OPEN',
  ASSIGNED: 'ASSIGNED',
  CLOSED: 'CLOSED'
};

const projectSchema = new mongoose.Schema(
  {
    clientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Client ID is required'],
      index: true
    },

    title: {
      type: String,
      required: [true, 'Project title is required'],
      trim: true,
      minlength: [10, 'Title must be at least 10 characters'],
      maxlength: [200, 'Title cannot exceed 200 characters']
    },

    description: {
      type: String,
      required: [true, 'Project description is required'],
      trim: true,
      minlength: [50, 'Description must be at least 50 characters'],
      maxlength: [5000, 'Description cannot exceed 5000 characters']
    },

    requiredSkills: [{
      type: String,
      required: true,
      trim: true,
      lowercase: true
    }],

    status: {
      type: String,
      enum: {
        values: Object.values(PROJECT_STATUS),
        message: 'Status must be OPEN, ASSIGNED, or CLOSED'
      },
      default: PROJECT_STATUS.OPEN,
      index: true // Index for filtering by status
    },

    biddingEndsAt: {
      type: Date,
      required: [true, 'Bidding end date is required'],
      index: true, // Index for filtering active projects
      validate: {
        validator: function(value) {
          return value > new Date();
        },
        message: 'Bidding end date must be in the future'
      }
    },

    lowestBid: {
      type: Number,
      default: null,
      min: [0, 'Lowest bid cannot be negative']
    },

    totalBids: {
      type: Number,
      default: 0,
      min: [0, 'Total bids cannot be negative']
    },

    // Additional project fields
    budget: {
      min: {
        type: Number,
        required: [true, 'Minimum budget is required'],
        min: [0, 'Budget cannot be negative']
      },
      max: {
        type: Number,
        required: [true, 'Maximum budget is required'],
        min: [0, 'Budget cannot be negative']
      }
    },

    category: {
      type: String,
      required: [true, 'Project category is required'],
      trim: true,
      enum: {
        values: [
          'Web Development',
          'Mobile Development',
          'Design',
          'Writing',
          'Marketing',
          'Data Entry',
          'Video & Animation',
          'Music & Audio',
          'Programming',
          'Business',
          'Other'
        ],
        message: 'Invalid project category'
      }
    },

    attachments: [{
      filename: String,
      url: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }],

    // Assigned freelancer (when project is ASSIGNED)
    assignedFreelancerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },

    assignedBidId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Bid',
      default: null
    },

    assignedAt: {
      type: Date,
      default: null
    },

    // Project completion
    completedAt: {
      type: Date,
      default: null
    },

    // Views counter
    views: {
      type: Number,
      default: 0,
      min: 0
    },

    // Featured project
    isFeatured: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound indexes for common queries
projectSchema.index({ status: 1, biddingEndsAt: -1 });
projectSchema.index({ clientId: 1, status: 1 });
projectSchema.index({ requiredSkills: 1, status: 1 });
projectSchema.index({ createdAt: -1 });
projectSchema.index({ category: 1, status: 1 });

// Virtual for time remaining
projectSchema.virtual('timeRemaining').get(function () {
  if (this.status !== PROJECT_STATUS.OPEN) {
    return 0;
  }
  const now = new Date();
  const remaining = this.biddingEndsAt - now;
  return Math.max(0, remaining);
});

// Virtual for checking if bidding is active
projectSchema.virtual('isBiddingActive').get(function () {
  return this.status === PROJECT_STATUS.OPEN && new Date() < this.biddingEndsAt;
});

// Virtual to populate bids count
projectSchema.virtual('bids', {
  ref: 'Bid',
  localField: '_id',
  foreignField: 'projectId'
});

// Method to increment bid count
projectSchema.methods.incrementBidCount = async function () {
  this.totalBids += 1;
  return this.save();
};

// Method to update lowest bid
projectSchema.methods.updateLowestBid = async function (bidAmount) {
  if (this.lowestBid === null || bidAmount < this.lowestBid) {
    this.lowestBid = bidAmount;
    return this.save();
  }
  return this;
};

// Method to assign project to freelancer
projectSchema.methods.assignToFreelancer = async function (freelancerId, bidId) {
  this.status = PROJECT_STATUS.ASSIGNED;
  this.assignedFreelancerId = freelancerId;
  this.assignedBidId = bidId;
  this.assignedAt = new Date();
  return this.save();
};

// Method to close project
projectSchema.methods.closeProject = async function () {
  this.status = PROJECT_STATUS.CLOSED;
  this.completedAt = new Date();
  return this.save();
};

// Method to increment views
projectSchema.methods.incrementViews = async function () {
  this.views += 1;
  return this.save();
};

// Static method to find active projects
projectSchema.statics.findActive = function () {
  return this.find({
    status: PROJECT_STATUS.OPEN,
    biddingEndsAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Static method to find by client
projectSchema.statics.findByClient = function (clientId) {
  return this.find({ clientId }).sort({ createdAt: -1 });
};

// Static method to find by skills
projectSchema.statics.findBySkills = function (skills) {
  return this.find({
    requiredSkills: { $in: skills },
    status: PROJECT_STATUS.OPEN,
    biddingEndsAt: { $gt: new Date() }
  }).sort({ createdAt: -1 });
};

// Pre-save middleware to validate budget
projectSchema.pre('save', function (next) {
  if (this.budget.max < this.budget.min) {
    next(new Error('Maximum budget must be greater than minimum budget'));
  }
  next();
});

// Automatically close projects when bidding ends
projectSchema.pre('save', function (next) {
  if (this.status === PROJECT_STATUS.OPEN && new Date() >= this.biddingEndsAt) {
    this.status = PROJECT_STATUS.CLOSED;
  }
  next();
});

const Project = mongoose.model('Project', projectSchema);

export default Project;
export { PROJECT_STATUS };
