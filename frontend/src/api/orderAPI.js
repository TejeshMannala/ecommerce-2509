import axiosInstance from './axiosInstance';
import { API_ENDPOINTS } from './endpoints';
import { normalizeOrderCreatePayload, unwrapData } from './apiUtils';

export const orderAPI = {
  // Get user orders
  getOrders: async (params = {}) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORDERS.ROOT, { params });
    return unwrapData(response);
  },

  // Get order by ID
  getOrderById: async (orderId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORDERS.ITEM(orderId));
    return unwrapData(response);
  },

  // Create order
  createOrder: async (orderData) => {
    const payload = normalizeOrderCreatePayload(orderData);
    const response = await axiosInstance.post(API_ENDPOINTS.ORDERS.ROOT, payload);
    return unwrapData(response);
  },

  // Update order
  updateOrder: async (orderId, orderData) => {
    const response = await axiosInstance.put(API_ENDPOINTS.ORDERS.ITEM(orderId), orderData);
    return unwrapData(response);
  },

  // Cancel order
  cancelOrder: async (orderId) => {
    const response = await axiosInstance.post(API_ENDPOINTS.ORDERS.CANCEL(orderId));
    return unwrapData(response);
  },

  // Get order status
  getOrderStatus: async (orderId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORDERS.STATUS(orderId));
    return unwrapData(response);
  },

  // Get order tracking
  getOrderTracking: async (orderId) => {
    const response = await axiosInstance.get(API_ENDPOINTS.ORDERS.TRACKING(orderId));
    return unwrapData(response);
  },
};
