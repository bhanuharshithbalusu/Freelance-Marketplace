/**
 * User Model
 * Step 2.1 - User Schema
 * 
 * Represents both CLIENT and FREELANCER users
 * Rule: Every user has exactly one role (CLIENT | FREELANCER)
 */

import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { USER_ROLES } from '../config/constants.js';

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },

    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address'
      ]
    },

    password: {
      type: String,
      required: function() {
        // Password not required if user signed up with Google
        return !this.googleId;
      },
      minlength: [6, 'Password must be at least 6 characters'],
      select: false // Don't return password by default in queries
    },

    role: {
      type: String,
      required: [true, 'User role is required'],
      enum: {
        values: Object.values(USER_ROLES),
        message: 'Role must be either CLIENT or FREELANCER'
      }
    },

    // Additional user fields for profile
    avatar: {
      type: String,
      default: null
    },

    bio: {
      type: String,
      maxlength: [500, 'Bio cannot exceed 500 characters'],
      default: ''
    },

    // Freelancer-specific fields
    skills: [{
      type: String,
      trim: true
    }],

    hourlyRate: {
      type: Number,
      min: [0, 'Hourly rate cannot be negative'],
      default: null
    },

    // Client-specific fields
    companyName: {
      type: String,
      trim: true,
      maxlength: [200, 'Company name cannot exceed 200 characters'],
      default: null
    },

    // Account status
    isActive: {
      type: Boolean,
      default: true
    },

    isEmailVerified: {
      type: Boolean,
      default: false
    },

    // Tokens for authentication
    refreshToken: {
      type: String,
      select: false
    },

    // Password reset
    resetPasswordToken: {
      type: String,
      select: false
    },

    resetPasswordExpires: {
      type: Date,
      select: false
    },

    // Email verification
    emailVerificationToken: {
      type: String,
      select: false
    },

    emailVerificationExpire: {
      type: Date,
      select: false
    },

    // Last login tracking
    lastLogin: {
      type: Date,
      default: null
    },

    // Google OAuth fields
    googleId: {
      type: String,
      unique: true,
      sparse: true, // Allow null values
      index: true
    },

    profilePicture: {
      type: String,
      default: null
    }
  },
  {
    timestamps: true, // Automatically adds createdAt and updatedAt
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });
userSchema.index({ createdAt: -1 });

// Hash password before saving
userSchema.pre('save', async function (next) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified('password')) {
    return next();
  }

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error('Password comparison failed');
  }
};

// Method to get public profile (exclude sensitive data)
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpire;
  delete obj.emailVerificationToken;
  delete obj.emailVerificationExpire;
  delete obj.__v;
  return obj;
};

// Virtual for full name formatting
userSchema.virtual('displayName').get(function () {
  return this.name;
});

// Static method to find by email
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Static method to find by role
userSchema.statics.findByRole = function (role) {
  return this.find({ role });
};

const User = mongoose.model('User', userSchema);

export default User;
