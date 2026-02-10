/**
 * Application Constants
 * Step 0.2 - User Roles Definition
 */

// User Roles Enum
export const USER_ROLES = {
  CLIENT: 'CLIENT',
  FREELANCER: 'FREELANCER'
};

// Validate that every user has exactly one role
export const isValidRole = (role) => {
  return Object.values(USER_ROLES).includes(role);
};

// Project Status
export const PROJECT_STATUS = {
  DRAFT: 'DRAFT',
  OPEN: 'OPEN',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED'
};

// Proposal Status
export const PROPOSAL_STATUS = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REJECTED: 'REJECTED',
  WITHDRAWN: 'WITHDRAWN'
};

// Payment Status
export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  ESCROW: 'ESCROW',
  RELEASED: 'RELEASED',
  REFUNDED: 'REFUNDED'
};

// Message Status
export const MESSAGE_STATUS = {
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ'
};

export default {
  USER_ROLES,
  PROJECT_STATUS,
  PROPOSAL_STATUS,
  PAYMENT_STATUS,
  MESSAGE_STATUS,
  isValidRole
};
