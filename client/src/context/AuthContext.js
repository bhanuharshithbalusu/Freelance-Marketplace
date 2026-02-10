/**
 * Authentication Context
 * Manages user authentication state across the app
 * 
 * Features:
 * - JWT token storage (access + refresh)
 * - Automatic token refresh
 * - Socket.IO connection management
 * - Role-based access control
 * - Persistent auth state
 */

'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import socketService from '../services/socket';
import { USER_ROLES } from '../constants/roles';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [tokenRefreshInterval, setTokenRefreshInterval] = useState(null);

  // Check if user is already logged in on mount
  useEffect(() => {
    checkAuth();
    
    // Cleanup on unmount
    return () => {
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
      }
    };
  }, []);

  // Setup automatic token refresh (every 10 minutes)
  const setupTokenRefresh = useCallback(() => {
    // Clear existing interval
    if (tokenRefreshInterval) {
      clearInterval(tokenRefreshInterval);
    }

    // Refresh token every 10 minutes (access token expires in 15 minutes)
    const interval = setInterval(async () => {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        clearInterval(interval);
        return;
      }

      try {
        const response = await api.auth.refresh(refreshToken);
        const { accessToken, refreshToken: newRefreshToken } = response.data.data;
        
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
        
        console.log('✅ Token refreshed automatically');
      } catch (error) {
        console.error('❌ Auto token refresh failed:', error);
        // If refresh fails, logout user
        logout();
      }
    }, 10 * 60 * 1000); // 10 minutes

    setTokenRefreshInterval(interval);
  }, [tokenRefreshInterval]);

  // Check authentication status
  const checkAuth = async () => {
    const token = localStorage.getItem('accessToken');
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await api.auth.me();
      const userData = response.data.data;
      
      setUser(userData);
      setIsAuthenticated(true);
      
      // Setup automatic token refresh
      setupTokenRefresh();
      
      // Connect socket
      socketService.connect(token);
      socketService.joinUserRoom(userData._id);
      
      console.log('✅ Auth restored:', userData.email, `(${userData.role})`);
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  // Login function
  const login = async (credentials) => {
    try {
      const response = await api.auth.login(credentials);
      const { user, accessToken, refreshToken } = response.data.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Update state
      setUser(user);
      setIsAuthenticated(true);
      
      // Setup automatic token refresh
      setupTokenRefresh();
      
      // Connect socket
      socketService.connect(accessToken);
      socketService.joinUserRoom(user._id);
      
      console.log('✅ Login successful:', user.email, `(${user.role})`);
      
      return { success: true, user };
    } catch (error) {
      console.error('❌ Login failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Login failed' 
      };
    }
  };

  // Register function
  const register = async (userData) => {
    try {
      const response = await api.auth.register(userData);
      const { user, accessToken, refreshToken } = response.data.data;
      
      // Store tokens
      localStorage.setItem('accessToken', accessToken);
      localStorage.setItem('refreshToken', refreshToken);
      
      // Update state
      setUser(user);
      setIsAuthenticated(true);
      
      // Setup automatic token refresh
      setupTokenRefresh();
      
      // Connect socket
      socketService.connect(accessToken);
      socketService.joinUserRoom(user._id);
      
      console.log('✅ Registration successful:', user.email, `(${user.role})`);
      
      return { success: true, user };
    } catch (error) {
      console.error('❌ Registration failed:', error);
      return { 
        success: false, 
        error: error.response?.data?.message || 'Registration failed' 
      };
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await api.auth.logout();
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout error:', error);
    } finally {
      // Clear tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
      
      // Clear token refresh interval
      if (tokenRefreshInterval) {
        clearInterval(tokenRefreshInterval);
        setTokenRefreshInterval(null);
      }
      
      // Disconnect socket
      socketService.disconnect();
    }
  };

  // Refresh access token manually
  const refreshAccessToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await api.auth.refresh(refreshToken);
      const { accessToken, refreshToken: newRefreshToken } = response.data.data;
      
      localStorage.setItem('accessToken', accessToken);
      if (newRefreshToken) {
        localStorage.setItem('refreshToken', newRefreshToken);
      }
      
      console.log('✅ Token refreshed manually');
      return accessToken;
    } catch (error) {
      console.error('❌ Token refresh failed:', error);
      logout();
      throw error;
    }
  };

  // Update user data
  const updateUser = (userData) => {
    setUser(prev => ({ ...prev, ...userData }));
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user is client
  const isClient = () => {
    return hasRole(USER_ROLES.CLIENT);
  };

  // Check if user is freelancer
  const isFreelancer = () => {
    return hasRole(USER_ROLES.FREELANCER);
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuth,
    refreshAccessToken,
    hasRole,
    isClient,
    isFreelancer
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export default AuthContext;
