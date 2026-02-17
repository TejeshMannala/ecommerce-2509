import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { wishlistAPI } from '../../api/wishlistAPI';

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
  if (Array.isArray(payload?.wishlist?.items)) {
    return payload.wishlist.items;
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
    category: item.category || item.product?.category || 'General',
    inStock: item.inStock !== false,
    maxQuantity: Number(item.maxQuantity || item.product?.stock || 99),
  };
};

const normalizeItems = (items) => items.map(normalizeItem).filter(Boolean);

export const fetchWishlist = createAsyncThunk('wishlist/fetchWishlist', async (_, thunkAPI) => {
  try {
    const response = await wishlistAPI.getWishlist();
    return normalizeItems(extractItems(response));
  } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || error.message || 'Failed to fetch wishlist');
  }
});

export const addWishlistItemAsync = createAsyncThunk(
  'wishlist/addWishlistItemAsync',
  async ({ productId, item }, thunkAPI) => {
    try {
      const response = await wishlistAPI.addToWishlist(productId, item);
      const responseItems = normalizeItems(extractItems(response));
      if (responseItems.length) {
        return { items: responseItems };
      }

      const apiItem = normalizeItem(response?.item || response?.data?.item || item);
      if (apiItem) {
        return { item: apiItem };
      }

      return thunkAPI.rejectWithValue('Unexpected wishlist response from server');
    } catch (error) {
      return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to add item to wishlist');
    }
  }
);

export const removeWishlistItemAsync = createAsyncThunk(
  'wishlist/removeWishlistItemAsync',
  async (productId, thunkAPI) => {
    try {
      const response = await wishlistAPI.removeFromWishlist(productId);
      const responseItems = normalizeItems(extractItems(response));
      return { productId, items: responseItems };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || 'Failed to remove item from wishlist'
      );
    }
  }
);

export const toggleWishlistItemAsync = createAsyncThunk(
  'wishlist/toggleWishlistItemAsync',
  async (item, thunkAPI) => {
    const state = thunkAPI.getState();
    const exists = state.wishlist.items.some(
      (wishlistItem) => String(wishlistItem.productId) === String(item.productId)
    );

    if (exists) {
      return thunkAPI.dispatch(removeWishlistItemAsync(item.productId)).unwrap().then(() => ({
        removed: true,
      }));
    }

    return thunkAPI.dispatch(addWishlistItemAsync({ productId: item.productId, item })).unwrap().then(() => ({
      removed: false,
    }));
  }
);

export const clearWishlistAsync = createAsyncThunk('wishlist/clearWishlistAsync', async (_, thunkAPI) => {
  try {
    await wishlistAPI.clearWishlist();
    return true;
  } catch (error) {
    return thunkAPI.rejectWithValue(error.response?.data?.message || 'Failed to clear wishlist');
  }
});

const initialState = {
  items: [],
  loading: false,
  error: null,
};

const wishlistSlice = createSlice({
  name: 'wishlist',
  initialState,
  reducers: {
    addToWishlist: (state, action) => {
      const incoming = normalizeItem(action.payload);
      if (!incoming) {
        return;
      }

      const exists = state.items.some((item) => item.productId === incoming.productId);
      if (!exists) {
        state.items.push(incoming);
      }
    },
    removeFromWishlist: (state, action) => {
      state.items = state.items.filter((item) => item.productId !== String(action.payload));
    },
    toggleWishlistItem: (state, action) => {
      const incoming = normalizeItem(action.payload);
      if (!incoming) {
        return;
      }

      const exists = state.items.some((item) => item.productId === incoming.productId);
      if (exists) {
        state.items = state.items.filter((item) => item.productId !== incoming.productId);
        return;
      }

      state.items.push(incoming);
    },
    clearWishlist: (state) => {
      state.items = [];
    },
    setWishlistItems: (state, action) => {
      state.items = normalizeItems(Array.isArray(action.payload) ? action.payload : []);
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchWishlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchWishlist.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchWishlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to fetch wishlist';
      })
      .addCase(addWishlistItemAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addWishlistItemAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.items) {
          state.items = action.payload.items;
          return;
        }

        const incoming = normalizeItem(action.payload.item);
        if (!incoming) {
          return;
        }
        const exists = state.items.some((item) => item.productId === incoming.productId);
        if (!exists) {
          state.items.push(incoming);
        }
      })
      .addCase(addWishlistItemAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to add item to wishlist';
      })
      .addCase(removeWishlistItemAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeWishlistItemAsync.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.items?.length) {
          state.items = action.payload.items;
          return;
        }
        state.items = state.items.filter((item) => item.productId !== String(action.payload.productId));
      })
      .addCase(removeWishlistItemAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to remove item from wishlist';
      })
      .addCase(clearWishlistAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearWishlistAsync.fulfilled, (state) => {
        state.loading = false;
        state.items = [];
      })
      .addCase(clearWishlistAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || 'Failed to clear wishlist';
      });
  },
});

export const {
  addToWishlist,
  removeFromWishlist,
  toggleWishlistItem,
  clearWishlist,
  setWishlistItems,
  clearError,
} = wishlistSlice.actions;

export default wishlistSlice.reducer;
