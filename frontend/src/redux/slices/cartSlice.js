import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { cartAPI } from '../../api/cartAPI';

const extractItems = (payload) => {
  if (Array.isArray(payload)) {
    return payload;
  }
  if (Array.isArray(payload?.items)) {
    return payload.items;
  }
  if (Array.isArray(payload?.data?.items)) {
    return payload.data.items;
  }
  if (Array.isArray(payload?.cart?.items)) {
    return payload.cart.items;
  }
  return [];
};

const normalizeItem = (item) => {
  if (!item) {
    return null;
  }

  const productId = item.productId || item.product?.id || item.id;
  if (!productId) {
    return null;
  }

  return {
    productId: String(productId),
    name: item.name || item.product?.name || 'Product',
    price: Number(item.price || item.product?.price || 0),
    image: item.image || item.product?.image || item.product?.images?.[0] || '/api/placeholder/100/100',
    quantity: Math.max(1, Number(item.quantity) || 1),
    maxQuantity: Number(item.maxQuantity || item.product?.stock || 99),
    inStock: item.inStock !== false,
  };
};

const normalizeItems = (items) => items.map(normalizeItem).filter(Boolean);

const upsertItem = (items, incomingItem) => {
  const normalized = normalizeItem(incomingItem);
  if (!normalized) {
    return items;
  }

  const index = items.findIndex((item) => String(item.productId) === String(normalized.productId));
  if (index === -1) {
    return [...items, normalized];
  }

  const updated = [...items];
  updated[index] = { ...updated[index], ...normalized };
  return updated;
};

export const fetchCart = createAsyncThunk('cart/fetchCart', async (_, thunkAPI) => {
  try {
    const response = await cartAPI.getCart();
    return normalizeItems(extractItems(response));
  } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch cart');
  }
});

export const addCartItemAsync = createAsyncThunk(
  'cart/addCartItemAsync',
  async ({ productId, quantity = 1, item }, thunkAPI) => {
    try {
      const response = await cartAPI.addToCart(productId, quantity, item);
      const responseItems = normalizeItems(extractItems(response));
      if (responseItems.length) {
        return { items: responseItems };
      }

      const apiItem = normalizeItem(response?.item || response?.data?.item || item);
      if (apiItem) {
        return { item: apiItem };
      }

      return thunkAPI.rejectWithValue('Unexpected cart response from server');
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add item to cart');
    }
  }
);

export const updateCartItemAsync = createAsyncThunk(
  'cart/updateCartItemAsync',
  async ({ productId, quantity }, thunkAPI) => {
    try {
      const response = await cartAPI.updateCartItem(productId, quantity);
      const responseItems = normalizeItems(extractItems(response));
      if (responseItems.length) {
        return { items: responseItems };
      }

      return { item: { productId, quantity } };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to update cart item');
    }
  }
);

export const removeCartItemAsync = createAsyncThunk(
  'cart/removeCartItemAsync',
  async (productId, thunkAPI) => {
    try {
      const response = await cartAPI.removeFromCart(productId);
      const responseItems = normalizeItems(extractItems(response));
      return { productId, items: responseItems };
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to remove item from cart');
    }
  }
);

export const clearCartAsync = createAsyncThunk('cart/clearCartAsync', async (_, thunkAPI) => {
  try {
    await cartAPI.clearCart();
    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to clear cart');
  }
});

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart: (state, action) => {
      state.items = upsertItem(state.items, action.payload);
    },
    updateCartItem: (state, action) => {
      const { productId, quantity } = action.payload;
      state.items = state.items.map((item) =>
        String(item.productId) === String(productId)
          ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
          : item
      );
    },
    removeFromCart: (state, action) => {
      state.items = state.items.filter((item) => String(item.productId) !== String(action.payload));
    },
    clearCart: (state) => {
      state.items = [];
    },
    setCartItems: (state, action) => {
      state.items = normalizeItems(Array.isArray(action.payload) ? action.payload : []);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch cart';
      })
      .addCase(addCartItemAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addCartItemAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.items) {
          state.items = action.payload.items;
          return;
        }
        state.items = upsertItem(state.items, action.payload.item);
      })
      .addCase(addCartItemAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add item to cart';
      })
      .addCase(updateCartItemAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCartItemAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.items) {
          state.items = action.payload.items;
          return;
        }
        const { productId, quantity } = action.payload.item;
        state.items = state.items.map((item) =>
          String(item.productId) === String(productId)
            ? { ...item, quantity: Math.max(1, Number(quantity) || 1) }
            : item
        );
      })
      .addCase(updateCartItemAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to update cart item';
      })
      .addCase(removeCartItemAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeCartItemAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.items?.length) {
          state.items = action.payload.items;
          return;
        }
        state.items = state.items.filter(
          (item) => String(item.productId) !== String(action.payload.productId)
        );
      })
      .addCase(removeCartItemAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove cart item';
      })
      .addCase(clearCartAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearCartAsync.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
      })
      .addCase(clearCartAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to clear cart';
      });
  },
});

export const { addToCart, updateCartItem, removeFromCart, clearCart, setCartItems, clearError } =
  cartSlice.actions;

export default cartSlice.reducer;
