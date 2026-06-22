import axios from 'axios';
import toast from 'react-hot-toast';

const resolveApiBaseUrl = () => {
  const url = String(import.meta.env.VITE_API_URL || '').trim();
  if (url) {
    return url.endsWith('/api') ? url : url.replace(/\/+$/, '') + '/api';
  }
  return import.meta.env.DEV ? 'http://localhost:5000/api' : '/api';
};

const API_BASE_URL = resolveApiBaseUrl();

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Endpoints that require authentication
const PROTECTED_ENDPOINTS = [
  '/cart', '/wishlist', '/orders', '/auth/me', '/auth/refresh',
  '/auth/logout',
];

const isProtectedEndpoint = (url = '') =>
  PROTECTED_ENDPOINTS.some((prefix) => url.startsWith(prefix));

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const isProtected = isProtectedEndpoint(config.url);
    config._hadAuthToken = Boolean(token);
    config._isProtected = isProtected;

    if (!token && isProtected) {
      const currentPath = window.location.pathname;
      const isAlreadyOnAuthPage = currentPath === '/login' || currentPath === '/register';
      if (!isAlreadyOnAuthPage) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.');
        window.location.replace('/login');
      }
      return Promise.reject(new Error('Not authorized, token missing'));
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
axiosInstance.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Network/CORS Errors
    if (!error.response) {
      toast.error('Network error or CORS issue. Please check your connection.');
      return Promise.reject(error);
    }

    const { status } = error.response;
    const requestUrl = String(error.config?.url || '');
    const isAuthEndpoint =
      requestUrl.includes('/auth/login') ||
      requestUrl.includes('/auth/register') ||
      requestUrl.includes('/auth/refresh');
    
    if (status === 401) {
      const currentPath = window.location.pathname;
      const isAlreadyOnAuthPage = currentPath === '/login' || currentPath === '/register';
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      toast.error('Session expired. Please log in again.');
      if (!isAlreadyOnAuthPage && !isAuthEndpoint) {
        window.location.replace('/login');
      }
    } else if (status === 403) {
      toast.error('You do not have permission to perform this action.');
    } else if (status === 404) {
      toast.error('The requested resource was not found.');
    } else if (status >= 500) {
      toast.error('Internal server error. Please try again later.');
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;
