/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  PRODUCTS: {
    GET_ALL: '/products',
    GET_BY_ID: '/products/:id',
    GET_BY_CATEGORY: '/products/category/:category',
    SEARCH: '/products/search',
    CREATE: '/products',
    UPDATE: '/products/:id',
    DELETE: '/products/:id',
    CATEGORIES: '/products/categories',
  },
  CART: {
    GET: '/cart',
    ADD_ITEM: '/cart/items',
    UPDATE_ITEM: '/cart/items/:id',
    REMOVE_ITEM: '/cart/items/:id',
    CLEAR: '/cart',
    TOTAL: '/cart/total',
  },
  ORDERS: {
    GET_ALL: '/orders',
    GET_BY_ID: '/orders/:id',
    CREATE: '/orders',
    UPDATE: '/orders/:id',
    CANCEL: '/orders/:id/cancel',
    STATUS: '/orders/:id/status',
    TRACKING: '/orders/:id/tracking',
  },
};

/**
 * App Constants
 */
export const APP_CONSTANTS = {
  CURRENCY: 'INR',
  TAX_RATE: 0.08,
  FREE_SHIPPING_THRESHOLD: 50,
  SHIPPING_COST: 5.99,
  DEFAULT_PAGE_SIZE: 20,
  DEBOUNCE_DELAY: 300,
  MAX_CART_QUANTITY: 99,
};

/**
 * Validation Rules
 */
export const VALIDATION_RULES = {
  EMAIL: {
    REGEX: /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
    MESSAGE: 'Please enter a valid email address',
  },
  PASSWORD: {
    MIN_LENGTH: 6,
    REQUIREMENTS: [
      'At least 6 characters',
      'At least one lowercase letter',
      'At least one uppercase letter',
      'At least one number',
    ],
  },
  NAME: {
    MIN_LENGTH: 2,
    MAX_LENGTH: 50,
  },
};

/**
 * Local Storage Keys
 */
export const STORAGE_KEYS = {
  TOKEN: 'token',
  USER: 'user',
  CART: 'cart',
  THEME: 'theme',
};

/**
 * Order Statuses
 */
export const ORDER_STATUSES = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

/**
 * Product Categories
 */
export const PRODUCT_CATEGORIES = [
  'Fruits',
  'Vegetables',
  'Dairy',
  'Bakery',
  'Meat & Poultry',
  'Seafood',
  'Beverages',
  'Snacks',
  'Frozen Foods',
  'Pantry Staples',
  'Household Essentials',
  'Personal Care',
  'Breakfast & Cereal',
];

/**
 * Notification Types
 */
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
};

/**
 * Breakpoints
 */
export const BREAKPOINTS = {
  SM: 640,
  MD: 768,
  LG: 1024,
  XL: 1280,
};
