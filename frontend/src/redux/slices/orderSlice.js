import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { orderAPI } from '../../api/orderAPI';

const extractOrders = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.orders)) {
    return payload.orders;
  }
  if (Array.isArray(payload?.data?.orders)) {
    return payload.data.orders;
  }
  if (Array.isArray(payload?.data)) {
    return payload.data;
  }
  return [];
};

const normalizeItem = (item) => ({
  id: String(item?.id || item?.productId || item?.product?.id || ''),
  productId: String(item?.productId || item?.id || item?.product?.id || ''),
  name: item?.name || item?.product?.name || 'Item',
  price: Number(item?.price || item?.product?.price || 0),
  quantity: Math.max(1, Number(item?.quantity) || 1),
  image: item?.image || item?.product?.image || item?.product?.images?.[0] || '/api/placeholder/100/100',
});

const normalizeOrder = (order) => ({
  id: String(order?.id || order?._id || ''),
  orderId: String(order?.orderId || order?.order_id || order?.id || order?._id || ''),
  status: order?.status || 'processing',
  createdAt: order?.createdAt || order?.created_at || new Date().toISOString(),
  estimatedDelivery: order?.estimatedDelivery || order?.estimated_delivery || null,
  total: Number(order?.total || 0),
  userId: String(order?.userId || order?.user_id || ''),
  shippingInfo: order?.shippingInfo || order?.shipping || {},
  payment: order?.payment || {},
  items: Array.isArray(order?.items) ? order.items.map(normalizeItem) : [],
});

const normalizeOrders = (orders) => orders.map(normalizeOrder).filter((order) => order.id);

export const fetchOrders = createAsyncThunk('orders/fetchOrders', async (params = {}, thunkAPI) => {
  try {
    const response = await orderAPI.getOrders(params);
    return normalizeOrders(extractOrders(response));
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch orders');
  }
});

export const fetchOrderById = createAsyncThunk('orders/fetchOrderById', async (orderId, thunkAPI) => {
  try {
    const response = await orderAPI.getOrderById(orderId);
    const order = normalizeOrder(response?.order || response?.data || response);
    if (!order.id) {
      return thunkAPI.rejectWithValue('Order not found');
    }
    return order;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to fetch order');
  }
});

export const createOrderAsync = createAsyncThunk(
  'orders/createOrderAsync',
  async (orderData, thunkAPI) => {
    try {
      const response = await orderAPI.createOrder(orderData);
      const order = normalizeOrder(response?.order || response?.data || response);
      if (!order.id) {
        return thunkAPI.rejectWithValue('Unexpected order response from server');
      }
      return order;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to create order');
    }
  }
);

export const cancelOrderAsync = createAsyncThunk(
  'orders/cancelOrderAsync',
  async (orderId, thunkAPI) => {
    try {
      const response = await orderAPI.cancelOrder(orderId);
      const order = normalizeOrder(response?.order || response?.data || { id: orderId, status: 'cancelled' });
      return order;
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to cancel order');
    }
  }
);

const initialState = {
  orders: [],
  loading: false,
  error: null,
  currentOrder: null,
};

const orderSlice = createSlice({
  name: 'orders',
  initialState,
  reducers: {
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload ? normalizeOrder(action.payload) : null;
    },
    clearCurrentOrder: (state) => {
      state.currentOrder = null;
    },
    setOrders: (state, action) => {
      state.orders = normalizeOrders(Array.isArray(action.payload) ? action.payload : []);
    },
    clearOrders: (state) => {
      state.orders = [];
      state.currentOrder = null;
      state.loading = false;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch orders';
      })
      .addCase(fetchOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        const index = state.orders.findIndex((order) => order.id === action.payload.id);
        if (index === -1) {
          state.orders.unshift(action.payload);
          return;
        }
        state.orders[index] = action.payload;
      })
      .addCase(fetchOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch order';
      })
      .addCase(createOrderAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createOrderAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.currentOrder = action.payload;
        state.orders.unshift(action.payload);
      })
      .addCase(createOrderAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to create order';
      })
      .addCase(cancelOrderAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(cancelOrderAsync.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.orders.findIndex((order) => order.id === action.payload.id);
        if (index !== -1) {
          state.orders[index] = { ...state.orders[index], ...action.payload, status: 'cancelled' };
        }
        if (state.currentOrder?.id === action.payload.id) {
          state.currentOrder = { ...state.currentOrder, ...action.payload, status: 'cancelled' };
        }
      })
      .addCase(cancelOrderAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to cancel order';
      });
  },
});

export const { setCurrentOrder, clearCurrentOrder, setOrders, clearOrders, clearError } = orderSlice.actions;

export default orderSlice.reducer;
