/**
 * TypeScript Type Definitions
 * Global types for the application
 */

// User type
export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'CLIENT' | 'FREELANCER';
  avatar?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
}

// Auth context type
export interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthResult>;
  register: (userData: RegisterData) => Promise<AuthResult>;
  logout: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  checkAuth: () => Promise<void>;
  refreshAccessToken: () => Promise<string>;
  hasRole: (role: string) => boolean;
  isClient: () => boolean;
  isFreelancer: () => boolean;
}

// Login credentials
export interface LoginCredentials {
  email: string;
  password: string;
}

// Registration data
export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: 'CLIENT' | 'FREELANCER';
}

// Auth result
export interface AuthResult {
  success: boolean;
  user?: User;
  error?: string;
}

// API Response
export interface ApiResponse<T = any> {
  success: boolean;
  data: T;
  message?: string;
}

// Project type
export interface Project {
  _id: string;
  title: string;
  description: string;
  clientId: string;
  budget: {
    min: number;
    max: number;
  };
  skillsRequired: string[];
  biddingDeadline: string;
  status: 'OPEN' | 'ASSIGNED' | 'CLOSED';
  assignedFreelancer?: string;
  lowestBid?: number;
  totalBids: number;
  createdAt: string;
  updatedAt: string;
}

// Bid type
export interface Bid {
  _id: string;
  projectId: string;
  freelancerId: string;
  amount: number;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}
