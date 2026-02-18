export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    ME: '/auth/me',
  },
  CART: {
    ROOT: '/cart',
    ITEMS: '/cart/items',
    ITEM: (productId) => `/cart/items/${productId}`,
    TOTAL: '/cart/total',
  },
  WISHLIST: {
    ROOT: '/wishlist',
    ITEMS: '/wishlist/items',
    ITEM: (productId) => `/wishlist/items/${productId}`,
  },
  ORDERS: {
    ROOT: '/orders',
    ITEM: (orderId) => `/orders/${orderId}`,
    CANCEL: (orderId) => `/orders/${orderId}/cancel`,
    STATUS: (orderId) => `/orders/${orderId}/status`,
    TRACKING: (orderId) => `/orders/${orderId}/tracking`,
  },
};
