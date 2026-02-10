/**
 * User Roles Constants
 * Step 0.2 - User Roles Definition
 * 
 * Rule: Every user has exactly one role
 */

export enum UserRole {
  CLIENT = 'CLIENT',
  FREELANCER = 'FREELANCER'
}

// Legacy export for compatibility
export const USER_ROLES = {
  CLIENT: 'CLIENT' as const,
  FREELANCER: 'FREELANCER' as const
};

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  [UserRole.CLIENT]: 'Client',
  [UserRole.FREELANCER]: 'Freelancer'
};

export const USER_ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  [UserRole.CLIENT]: 'Post projects and hire freelancers',
  [UserRole.FREELANCER]: 'Bid on projects and deliver work'
};

// Type guard to check if a string is a valid UserRole
export const isValidUserRole = (role: string): role is UserRole => {
  return Object.values(UserRole).includes(role as UserRole);
};
