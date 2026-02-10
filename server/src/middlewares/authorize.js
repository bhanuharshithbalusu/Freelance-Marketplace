/**
 * Role-based Authorization Middleware
 * Step 3.3 - Role Middleware
 * 
 * Allow access based on user role
 * Protect client and freelancer routes separately
 */

import { ForbiddenError } from '../utils/errors.js';
import { USER_ROLES } from '../config/constants.js';

/**
 * Check if user has required role(s)
 * @param {...String} allowedRoles - Allowed roles (CLIENT, FREELANCER)
 * @returns {Function} Middleware function
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    // Check if user is authenticated
    if (!req.user) {
      return next(new ForbiddenError('Authentication required'));
    }

    // Check if user's role is allowed
    if (!allowedRoles.includes(req.user.role)) {
      return next(
        new ForbiddenError(
          `Access denied. This route is restricted to ${allowedRoles.join(' and ')} only.`
        )
      );
    }

    next();
  };
};

/**
 * Only CLIENT role allowed
 */
export const clientOnly = authorizeRoles(USER_ROLES.CLIENT);

/**
 * Only FREELANCER role allowed
 */
export const freelancerOnly = authorizeRoles(USER_ROLES.FREELANCER);

/**
 * Both CLIENT and FREELANCER allowed (any authenticated user)
 */
export const anyAuthenticated = authorizeRoles(
  USER_ROLES.CLIENT,
  USER_ROLES.FREELANCER
);

/**
 * Check if user owns the resource
 * @param {Function} getResourceOwnerId - Function to get resource owner ID from request
 */
export const checkOwnership = (getResourceOwnerId) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(new ForbiddenError('Authentication required'));
      }

      const resourceOwnerId = await getResourceOwnerId(req);

      if (req.user.id.toString() !== resourceOwnerId.toString()) {
        return next(
          new ForbiddenError('Access denied. You do not own this resource.')
        );
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Check if user is CLIENT and owns the project
 */
export const isProjectOwner = checkOwnership(async (req) => {
  const Project = (await import('../models/Project.js')).default;
  const project = await Project.findById(req.params.projectId || req.params.id);
  
  if (!project) {
    throw new Error('Project not found');
  }
  
  return project.clientId;
});

/**
 * Check if user is FREELANCER and owns the bid
 */
export const isBidOwner = checkOwnership(async (req) => {
  const Bid = (await import('../models/Bid.js')).default;
  const bid = await Bid.findById(req.params.bidId || req.params.id);
  
  if (!bid) {
    throw new Error('Bid not found');
  }
  
  return bid.freelancerId;
});

export default {
  authorizeRoles,
  clientOnly,
  freelancerOnly,
  anyAuthenticated,
  checkOwnership,
  isProjectOwner,
  isBidOwner
};
