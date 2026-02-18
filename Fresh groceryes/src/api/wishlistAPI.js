import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from './endpoints';
import { unwrapData } from './apiUtils';

export const wishlistAPI = {
  getWishlist: async () => {
    const response = await axiosInstance.get(API_ENDPOINTS.WISHLIST.ROOT);
    return unwrapData(response);
  },

  addToWishlist: async (productId, item = {}) => {
    const payload = {
      productId,
      name: item?.name,
      price: item?.price,
      image: item?.image,
      sku: item?.sku,
      notes: item?.notes,
    };
    const response = await axiosInstance.post(API_ENDPOINTS.WISHLIST.ITEMS, payload);
    return unwrapData(response);
  },

  removeFromWishlist: async (productId) => {
    const response = await axiosInstance.delete(API_ENDPOINTS.WISHLIST.ITEM(productId));
    return unwrapData(response);
  },

  clearWishlist: async () => {
    const response = await axiosInstance.delete(API_ENDPOINTS.WISHLIST.ROOT);
    return unwrapData(response);
  },
};
