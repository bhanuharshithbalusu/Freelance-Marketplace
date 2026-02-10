/**
 * API Service
 * Centralized HTTP client for API requests
 */

import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor - Add auth token to requests
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If 401 and not already retried, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${API_URL}/auth/refresh`, {
          refreshToken
        });

        const { accessToken } = response.data.data;
        localStorage.setItem('accessToken', accessToken);

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed, logout user
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API methods
const api = {
  // Auth endpoints
  auth: {
    register: (data) => apiClient.post('/auth/register', data),
    login: (data) => apiClient.post('/auth/login', data),
    logout: () => apiClient.post('/auth/logout'),
    refresh: (refreshToken) => apiClient.post('/auth/refresh', { refreshToken }),
    me: () => apiClient.get('/auth/me'),
    getProfile: () => apiClient.get('/auth/me'),
    updateProfile: (data) => apiClient.put('/auth/profile', data)
  },

  // User endpoints
  users: {
    getProfile: (userId) => apiClient.get(`/users/${userId}`),
    updateProfile: (userId, data) => apiClient.put(`/users/${userId}`, data),
    uploadAvatar: (formData) => apiClient.post('/users/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },

  // Project endpoints
  projects: {
    getAll: (params) => apiClient.get('/projects', { params }),
    getById: (projectId) => apiClient.get(`/projects/${projectId}`),
    create: (data) => apiClient.post('/projects', data),
    update: (projectId, data) => apiClient.put(`/projects/${projectId}`, data),
    delete: (projectId) => apiClient.delete(`/projects/${projectId}`),
    close: (projectId) => apiClient.patch(`/projects/${projectId}/close`),
    getMyProjects: () => apiClient.get('/projects/my-projects'),
    assign: (projectId, data) => apiClient.post(`/projects/${projectId}/assign`, data)
  },

  // Bid endpoints
  bids: {
    getAll: (params) => apiClient.get('/bids', { params }),
    getById: (bidId) => apiClient.get(`/bids/${bidId}`),
    getByProject: (projectId) => apiClient.get(`/projects/${projectId}/bids`),
    create: (projectId, data) => apiClient.post(`/projects/${projectId}/bids`, data),
    update: (bidId, data) => apiClient.patch(`/bids/${bidId}`, data),
    withdraw: (bidId) => apiClient.delete(`/bids/${bidId}`),
    getMyBids: () => apiClient.get('/bids/my-bids')
  },

  // Dashboard endpoints
  dashboard: {
    get: () => apiClient.get('/dashboard')
  },
};

export default api;
export { apiClient };
