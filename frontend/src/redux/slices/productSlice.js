import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  products: [],
  loading: false,
  error: null,
  filters: {
    category: '',
    priceRange: { min: '', max: '' },
    sortBy: 'name-asc',
  },
  searchQuery: '',
};

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    // Loading states
    fetchProductsStart: (state) => {
      state.loading = true;
      state.error = null;
    },
    fetchProductsSuccess: (state, action) => {
      state.loading = false;
      state.products = action.payload;
      state.error = null;
    },
    fetchProductsFailure: (state, action) => {
      state.loading = false;
      state.error = action.payload;
    },
    
    // Search and filters
    setSearchQuery: (state, action) => {
      state.searchQuery = action.payload;
    },
    setFilters: (state, action) => {
      state.filters = { ...state.filters, ...action.payload };
    },
    clearFilters: (state) => {
      state.filters = {
        category: '',
        priceRange: { min: '', max: '' },
        sortBy: 'name-asc',
      };
      state.searchQuery = '';
    },
    
    // Product operations
    addProduct: (state, action) => {
      state.products.push(action.payload);
    },
    updateProduct: (state, action) => {
      const index = state.products.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.products[index] = action.payload;
      }
    },
    deleteProduct: (state, action) => {
      state.products = state.products.filter(p => p.id !== action.payload);
    },
    
    // Clear error
    clearError: (state) => {
      state.error = null;
    },
  },
});

export const { 
  fetchProductsStart, 
  fetchProductsSuccess, 
  fetchProductsFailure,
  setSearchQuery,
  setFilters,
  clearFilters,
  addProduct,
  updateProduct,
  deleteProduct,
  clearError 
} = productSlice.actions;

export default productSlice.reducer;