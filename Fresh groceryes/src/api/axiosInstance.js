import axios from 'axios';
import { getApiBaseUrl } from '../config/apiBaseUrl';

const API_BASE_URL = getApiBaseUrl();

// Create axios instance
const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    config._hadAuthToken = Boolean(token);
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
    if (error.response?.status === 401) {
      const requestUrl = String(error.config?.url || '');
      const isAuthEndpoint =
        requestUrl.includes('/auth/login') ||
        requestUrl.includes('/auth/register') ||
        requestUrl.includes('/auth/refresh');
      const hadAuthToken =
        Boolean(error.config?._hadAuthToken) || Boolean(error.config?.headers?.Authorization);

      // Redirect only for expired/invalid authenticated sessions, not for login/register failures.
      if (!isAuthEndpoint && hadAuthToken) {
        const currentPath = window.location.pathname;
        const isAlreadyOnAuthPage = currentPath === '/login' || currentPath === '/register';

        localStorage.removeItem('token');
        localStorage.removeItem('user');

        if (!isAlreadyOnAuthPage) {
          window.location.replace('/login');
        }
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
