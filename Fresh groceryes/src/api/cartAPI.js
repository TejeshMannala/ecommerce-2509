import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from './endpoints';
import { unwrapData } from './apiUtils';

export const cartAPI = {
  // Get cart items
  getCart: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.CART.ROOT);
    return unwrapData(response);
  },

  // Add item to cart
  addToCart: async (productId, quantity = 1, item = {}) => {
    const payload = {
      productId,
      quantity,
      name: item?.name,
      price: item?.price,
      image: item?.image,
      sku: item?.sku,
    };
    const response = await axiosInstance.post(API_ENDPOINTS.CART.ITEMS, payload);
    return unwrapData(response);
  },

  // Update cart item quantity
  updateCartItem: async (productId, quantity) => {
    const response = await axiosInstance.put(API_ENDPOINTS.CART.ITEM(productId), { quantity });
    return unwrapData(response);
  },

  // Remove item from cart
  removeFromCart: async (productId) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.CART.ITEM(productId));
    return unwrapData(response);
  },

  // Clear cart
  clearCart: async () => {
    const response = await axiosInstance.delete(API_ENDPOINTS.CART.ROOT);
    return unwrapData(response);
  },

  // Get cart total
  getCartTotal: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.CART.TOTAL);
    return unwrapData(response);
  },
};
