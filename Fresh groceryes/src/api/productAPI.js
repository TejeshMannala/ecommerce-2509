import axiosInstance from './axiosInstance';
import { PRODUCT_CATEGORIES } from '../utils/constants';

const MIN_PRODUCT_PRICE = 50;
const MAX_PRODUCT_PRICE = 200;
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
    image: product?.images?.[0]?.url || '/api/placeholder/100/100',
    images: Array.isArray(product?.images)
      ? product.images.map((img) => img?.url).filter(Boolean)
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

export const productAPI = {
  // Get all products
  getProducts: async (params = {}) => {
    const response = await axiosInstance.get('/products', { params });
    const data = response.data || {};
    return {
      products: normalizeProducts(data?.products || []),
      pagination: data?.pagination || null,
    };
  },

  // Get product by ID
  getProductById: async (id) => {
    const response = await axiosInstance.get(`/products/${id}`);
    return {
      product: normalizeProduct(response?.data?.product || {}),
    };
  },

  // Get products by category
  getProductsByCategory: async (category, params = {}) => {
    const response = await axiosInstance.get(`/products/category/${category}`, { params });
    const data = response.data || {};
    return {
      products: normalizeProducts(data?.products || []),
      pagination: data?.pagination || null,
    };
  },

  // Search products
  searchProducts: async (query, params = {}) => {
    const response = await axiosInstance.get('/products/search', { 
      params: { q: query, ...params } 
    });
    const data = response.data || {};
    return {
      products: normalizeProducts(data?.products || []),
      pagination: data?.pagination || null,
    };
  },




  // Get categories
  getCategories: async () => {
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
