import axiosInstance from './axiosInstance';
import { PRODUCT_CATEGORIES } from '../utils/constants';
import { productCatalog } from '../features/products/productCatalog';

const MIN_PRODUCT_PRICE = 50;
const MAX_PRODUCT_PRICE = 200;
// Use the live API by default (dev and production). The bundled sample catalog
// is only used when explicitly opted in via VITE_USE_BUNDLED_CATALOG=true. If
// the live API is unreachable, the per-request error handlers below still fall
// back to the bundled catalog so the storefront keeps working.
const USE_BUNDLED_CATALOG = import.meta.env.VITE_USE_BUNDLED_CATALOG === 'true';
const clampPrice = (value) =>
  Math.min(MAX_PRODUCT_PRICE, Math.max(MIN_PRODUCT_PRICE, Number(value || 0)));

const normalizeProduct = (product = {}) => {
  const price = clampPrice(product?.price);
  const discountPercentage = Number(product?.discount?.percentage || 0);
  const discountedPrice =
    discountPercentage > 0
      ? clampPrice(Number((price * (1 - discountPercentage / 100)).toFixed(2)))
      : price;

  return {
    id: String(product?._id || product?.id || ''),
    name: product?.name || 'Product',
    description: product?.description || '',
    category: product?.category || 'General',
    image:
      product?.image ||
      (Array.isArray(product?.images)
        ? product.images[0]?.url || (typeof product.images[0] === 'string' ? product.images[0] : '')
        : '') ||
      '/api/placeholder/100/100',
    images: Array.isArray(product?.images)
      ? product.images.map((img) => (typeof img === 'string' ? img : img?.url)).filter(Boolean)
      : [],
    price,
    discount: discountPercentage,
    discountPrice: discountedPrice,
    rating: Number(product?.ratings?.average || 0),
    reviews: Number(product?.ratings?.count || 0),
    stock: Number(product?.inventory?.quantity || 0),
    inStock:
      product?.status === 'active' &&
      (!product?.inventory?.trackInventory || Number(product?.inventory?.quantity || 0) > 0),
    specifications: product?.specifications || {},
    nutritionalInfo: product?.nutritionalInfo || {},
  };
};

const normalizeProducts = (products = []) => products.map(normalizeProduct).filter((p) => p.id);

const normalizeText = (value = '') => String(value).toLowerCase().trim();

const getFallbackProducts = (params = {}) => {
  const page = Math.max(1, Number(params.page || 1));
  const limit = Math.max(1, Number(params.limit || productCatalog.length));
  const search = normalizeText(params.search || params.q);
  const category = String(params.category || '').trim();
  const status = String(params.status || '').trim();

  let products = productCatalog;

  if (category) {
    products = products.filter((product) => product.category === category);
  }

  if (search) {
    products = products.filter((product) => {
      const searchable = normalizeText(
        `${product.name || ''} ${product.category || ''} ${product.description || ''}`
      );
      return searchable.includes(search);
    });
  }

  if (status === 'active') {
    products = products.filter((product) => product.inStock !== false);
  }

  const total = products.length;
  const start = (page - 1) * limit;
  const paginatedProducts = products.slice(start, start + limit);

  return {
    products: normalizeProducts(paginatedProducts),
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    },
    source: 'fallback',
  };
};

const shouldUseFallbackProducts = (error) =>
  !error?.response || error.response.status === 404 || error.response.status >= 500;

const warnFallback = (error) => {
  console.warn(
    'Product API unavailable; showing bundled catalog fallback.',
    error?.response?.data?.message || error?.message || error
  );
};

export const productAPI = {
  // Get all products
  getProducts: async (params = {}) => {
    if (USE_BUNDLED_CATALOG) {
      return getFallbackProducts(params);
    }

    try {
      const response = await axiosInstance.get('/products', { params });
      const data = response.data || {};
      return {
        products: normalizeProducts(data?.products || []),
        pagination: data?.pagination || null,
      };
    } catch (error) {
      if (shouldUseFallbackProducts(error)) {
        warnFallback(error);
        return getFallbackProducts(params);
      }
      throw error;
    }
  },

  // Get product by ID
  getProductById: async (id) => {
    if (USE_BUNDLED_CATALOG) {
      const fallbackProduct = productCatalog.find((product) => String(product.id) === String(id));
      if (fallbackProduct) {
        return { product: normalizeProduct(fallbackProduct), source: 'fallback' };
      }
    }

    try {
      const response = await axiosInstance.get(`/products/${id}`);
      return {
        product: normalizeProduct(response?.data?.product || {}),
      };
    } catch (error) {
      if (shouldUseFallbackProducts(error)) {
        warnFallback(error);
        const fallbackProduct = productCatalog.find((product) => String(product.id) === String(id));
        if (fallbackProduct) {
          return { product: normalizeProduct(fallbackProduct), source: 'fallback' };
        }
      }
      throw error;
    }
  },

  // Get products by category
  getProductsByCategory: async (category, params = {}) => {
    if (USE_BUNDLED_CATALOG) {
      return getFallbackProducts({ ...params, category });
    }

    try {
      const response = await axiosInstance.get(`/products/category/${category}`, { params });
      const data = response.data || {};
      return {
        products: normalizeProducts(data?.products || []),
        pagination: data?.pagination || null,
      };
    } catch (error) {
      if (shouldUseFallbackProducts(error)) {
        warnFallback(error);
        return getFallbackProducts({ ...params, category });
      }
      throw error;
    }
  },

  // Search products
  searchProducts: async (query, params = {}) => {
    if (USE_BUNDLED_CATALOG) {
      return getFallbackProducts({ ...params, q: query });
    }

    try {
      const response = await axiosInstance.get('/products/search', { 
        params: { q: query, ...params } 
      });
      const data = response.data || {};
      return {
        products: normalizeProducts(data?.products || []),
        pagination: data?.pagination || null,
      };
    } catch (error) {
      if (shouldUseFallbackProducts(error)) {
        warnFallback(error);
        return getFallbackProducts({ ...params, q: query });
      }
      throw error;
    }
  },




  // Get reviews for a product
  getProductReviews: async (productId, params = {}) => {
    try {
      const response = await axiosInstance.get(`/reviews/${productId}`, { params });
      return response.data;
    } catch {
      return { reviews: [], pagination: { total: 0, page: 1, limit: 10, totalPages: 0 }, ratingBreakdown: {} };
    }
  },

  // Get current user's review for a product
  getUserReviewForProduct: async (productId) => {
    try {
      const response = await axiosInstance.get(`/reviews/${productId}/user-review`);
      return response.data.review || null;
    } catch {
      return null;
    }
  },

  // Check if user can review this product
  checkCanReview: async (productId) => {
    try {
      const response = await axiosInstance.get(`/reviews/${productId}/can-review`);
      return response.data;
    } catch {
      return { canReview: false, reason: 'error' };
    }
  },

  // Create a review
  createReview: async (productId, data) => {
    const response = await axiosInstance.post(`/reviews/${productId}`, data);
    return response.data;
  },

  // Update a review
  updateReview: async (reviewId, data) => {
    const response = await axiosInstance.put(`/reviews/${reviewId}`, data);
    return response.data;
  },

  // Delete a review
  deleteReview: async (reviewId) => {
    const response = await axiosInstance.delete(`/reviews/${reviewId}`);
    return response.data;
  },

  // Get categories
  getCategories: async () => {
    if (USE_BUNDLED_CATALOG) {
      return PRODUCT_CATEGORIES;
    }

    try {
      const response = await axiosInstance.get('/products/categories');
      const data = response.data;

      if (Array.isArray(data)) {
        return data;
      }

      if (Array.isArray(data?.categories)) {
        return data.categories;
      }

      return PRODUCT_CATEGORIES;
    } catch {
      return PRODUCT_CATEGORIES;
    }
  },
};
