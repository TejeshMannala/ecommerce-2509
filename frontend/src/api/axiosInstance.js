import axios from 'axios';
import toast from 'react-hot-toast';

const PRODUCTION_API_URL = 'https://ecommerce-2509-server.onrender.com/api';
const STALE_RENDER_API_HOSTS = [
  'ecommerce-api.onrender.com',
  'freshbay-api.onrender.com',
];

const resolveApiBaseUrl = () => {
  const configuredUrl = String(import.meta.env.VITE_API_URL || '').trim();
  const isStaleRenderUrl = STALE_RENDER_API_HOSTS.some((host) => configuredUrl.includes(host));
  const isLocalProductionUrl = !import.meta.env.DEV && /localhost|127\.0\.0\.1/.test(configuredUrl);

  if (configuredUrl && !isStaleRenderUrl && !isLocalProductionUrl) {
    return configuredUrl;
  }

  return import.meta.env.DEV ? 'http://localhost:5000/api' : PRODUCTION_API_URL;
};

const API_BASE_URL = resolveApiBaseUrl();

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
    console.log(`API CALL: ${config.baseURL}${config.url}`);
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
      const hadAuthToken = Boolean(error.config?._hadAuthToken) || Boolean(error.config?.headers?.Authorization);
      if (!isAuthEndpoint && hadAuthToken) {
        const currentPath = window.location.pathname;
        const isAlreadyOnAuthPage = currentPath === '/login' || currentPath === '/register';
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        toast.error('Session expired. Please log in again.');
        if (!isAlreadyOnAuthPage) window.location.replace('/login');
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
