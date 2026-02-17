import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from './endpoints';
import { unwrapData } from './apiUtils';

export const authAPI = {
  // Login
  login: async (email, password) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGIN, { email, password });
    return unwrapData(response);
  },

  // Register
  register: async (userData) => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REGISTER, userData);
    return unwrapData(response);
  },

  // Logout
  logout: async () => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.LOGOUT);
    return unwrapData(response);
  },

  // Refresh token
  refreshToken: async () => {
    const response = await axiosInstance.post(API_ENDPOINTS.AUTH.REFRESH);
    return unwrapData(response);
  },

  // Get current user
  getCurrentUser: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.AUTH.ME);
    return unwrapData(response);
  },
};
