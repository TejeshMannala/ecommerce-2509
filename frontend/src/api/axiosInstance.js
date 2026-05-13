import axios from 'axios';

const PRODUCTION_API_URL = 'https://freshbay-api.onrender.com/api';
const STALE_RENDER_API_HOSTS = [
  'ecommerce-api.onrender.com',
  'ecommerce-2509-server.onrender.com',
];

const resolveApiBaseUrl = () => {
  const configuredUrl = String(import.meta.env.VITE_API_URL || '').trim();
  const isStaleRenderUrl = STALE_RENDER_API_HOSTS.some((host) => configuredUrl.includes(host));
  const isLocalProductionUrl = !import.meta.env.DEV && /localhost|127\.0\.0\.1/.test(configuredUrl);

  if (configuredUrl && !isStaleRenderUrl && !isLocalProductionUrl) {
    return configuredUrl;
  }

  return import.meta.env.DEV ? 'http://localhost:5001/api' : PRODUCTION_API_URL;
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
