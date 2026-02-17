import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import ProductGrid from './ProductGrid';
import { addCartItemAsync } from '../../redux/slices/cartSlice';
import { toggleWishlistItemAsync } from '../../redux/slices/wishlistSlice';
import { productAPI } from '../../api/productAPI';
import { buildReturnToLocation, isAuthenticatedUser } from '../../utils/auth';
import { PRODUCT_CATEGORIES } from '../../utils/constants';

const toCategoryParam = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const getNumericId = (id) => Number(String(id).replace(/\D/g, '')) || 0;
const normalizeText = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '');
const splitTokens = (value = '') =>
  String(value)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .split(/\s+/)
    .filter(Boolean);

const getSortComparator = (sortBy) => {
  switch (sortBy) {
    case 'name-desc':
      return (a, b) => b.name.localeCompare(a.name);
    case 'price-asc':
      return (a, b) => a.price - b.price;
    case 'price-desc':
      return (a, b) => b.price - a.price;
    case 'created-desc':
      return (a, b) => getNumericId(b.id) - getNumericId(a.id);
    case 'rating-desc':
      return (a, b) => b.rating - a.rating;
    case 'name-asc':
    default:
      return (a, b) => a.name.localeCompare(b.name);
  }
};

const fetchAllProducts = async (params = {}) => {
  const limit = 100;
  let page = 1;
  let totalPages = 1;
  const allProducts = [];

  while (page <= totalPages) {
    const response = await productAPI.getProducts({
      ...params,
      page,
      limit,
    });

    const chunk = Array.isArray(response?.products) ? response.products : [];
    allProducts.push(...chunk);
    totalPages = Number(response?.pagination?.totalPages || 1);
    page += 1;
  }

  return allProducts;
};

const getSearchScore = (product, rawQuery) => {
  const query = String(rawQuery || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
  if (!query) {
    return 0;
  }

  const normalizedQuery = normalizeText(query);
  const queryTokens = splitTokens(query);

  const name = String(product.name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const category = String(product.category || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const description = String(product.description || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  const normalizedName = normalizeText(product.name);
  const normalizedCategory = normalizeText(product.category);
  const normalizedDescription = normalizeText(product.description);
  const normalizedCombined = `${normalizedName} ${normalizedCategory} ${normalizedDescription}`;

  let score = 0;

  if (name.startsWith(query)) {
    score += 140;
  }
  if (name.includes(query)) {
    score += 90;
  }
  if (normalizedQuery && normalizedName.includes(normalizedQuery)) {
    score += 80;
  }
  if (normalizedQuery && normalizedCategory.includes(normalizedQuery)) {
    score += 50;
  }
  if (normalizedQuery && normalizedDescription.includes(normalizedQuery)) {
    score += 24;
  }
  if (normalizedQuery && normalizedCombined.includes(normalizedQuery)) {
    score += 20;
  }
  if (category.includes(query)) {
    score += 55;
  }
  if (description.includes(query)) {
    score += 30;
  }

  queryTokens.forEach((token) => {
    const normalizedToken = normalizeText(token);

    if (name.includes(token)) {
      score += 16;
    }
    if (category.includes(token)) {
      score += 10;
    }
    if (description.includes(token)) {
      score += 6;
    }
    if (normalizedToken && normalizedCombined.includes(normalizedToken)) {
      score += 8;
    }
  });

  return score;
};

const Products = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [searchParams, setSearchParams] = useSearchParams();
  const authState = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const isLoggedIn = isAuthenticatedUser(authState);
  const selectedCategory = useMemo(() => {
    const queryCategory = searchParams.get('category');
    if (!queryCategory) return '';

    const token = String(queryCategory).toLowerCase();
    const matchedCategory = PRODUCT_CATEGORIES.find(
      (category) => toCategoryParam(category) === token || String(category).toLowerCase() === token
    );

    return matchedCategory || queryCategory;
  }, [searchParams]);
  const searchQuery = useMemo(() => searchParams.get('search')?.trim() || '', [searchParams]);

  useEffect(() => {
    let isMounted = true;

    const loadProducts = async () => {
      try {
        setLoading(true);
        setError(null);
        const allProducts = await fetchAllProducts({
          category: selectedCategory || undefined,
          search: searchQuery || undefined,
          status: 'active',
        });
        if (isMounted) {
          setProducts(allProducts);
        }
      } catch (err) {
        if (isMounted) {
          setError(err?.response?.data?.message || err?.message || 'Failed to load products');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadProducts();

    return () => {
      isMounted = false;
    };
  }, [searchQuery, selectedCategory]);

  const filteredProducts = useMemo(() => {
    const trimmedQuery = searchQuery.trim();
    const sortComparator = getSortComparator('rating-desc');

    const searchableProducts = products
      .filter((product) => {
        if (selectedCategory && product.category !== selectedCategory) {
          return false;
        }

        return true;
      })
      .map((product) => ({
        product,
        score: getSearchScore(product, trimmedQuery),
      }))
      .filter((item) => !trimmedQuery || item.score > 0);

    searchableProducts.sort((a, b) => {
      if (trimmedQuery && b.score !== a.score) {
        return b.score - a.score;
      }

      return sortComparator(a.product, b.product);
    });

    return searchableProducts.map((item) => item.product);
  }, [products, searchQuery, selectedCategory]);

  const categorizedProducts = useMemo(() => {
    const bucket = new Map();

    filteredProducts.forEach((product) => {
      const key = product.category || 'Other';
      if (!bucket.has(key)) {
        bucket.set(key, []);
      }
      bucket.get(key).push(product);
    });

    const orderedKeys = [
      ...PRODUCT_CATEGORIES.filter((category) => bucket.has(category)),
      ...Array.from(bucket.keys()).filter((category) => !PRODUCT_CATEGORIES.includes(category)),
    ];

    return orderedKeys.map((category) => ({
      category,
      products: bucket.get(category) || [],
    }));
  }, [filteredProducts]);

  const handleClearFilters = () => {
    setSearchParams({});
  };

  const redirectToLogin = () => {
    navigate('/login', { state: { from: buildReturnToLocation(location) } });
  };

  const handleAddToCart = async (product) => {
    if (!isLoggedIn) {
      toast.error('Please sign in to add items to your cart');
      redirectToLogin();
      return;
    }

    const existing = cartItems.find((item) => item.productId === product.id);
    if (existing) {
      toast('Item is already in cart');
      return;
    }

    const discountedPrice =
      product.discount > 0 ? product.price - (product.price * product.discount) / 100 : product.price;

    try {
      await dispatch(
        addCartItemAsync({
          productId: product.id,
          quantity: 1,
          item: {
            productId: product.id,
            name: product.name,
            price: discountedPrice,
            image: product.image || product.images?.[0] || '/api/placeholder/100/100',
            quantity: 1,
            maxQuantity: product.stock || 99,
            inStock: product.inStock,
          },
        })
      ).unwrap();
      toast.success(`${product.name} added to cart`);
    } catch (error) {
      toast.error(error || 'Failed to add item to cart');
    }
  };

  const handleToggleWishlist = async (product) => {
    if (!isLoggedIn) {
      toast.error('Please sign in to save items to your wishlist');
      redirectToLogin();
      return;
    }

    const isInWishlist = wishlistItems.some((item) => item.productId === product.id);
    const discountedPrice =
      product.discount > 0 ? product.price - (product.price * product.discount) / 100 : product.price;

    try {
      const result = await dispatch(
        toggleWishlistItemAsync({
          productId: product.id,
          name: product.name,
          price: discountedPrice,
          image: product.image || product.images?.[0] || '/api/placeholder/100/100',
          category: product.category,
          inStock: product.inStock,
          maxQuantity: product.stock || 99,
        })
      ).unwrap();

      toast.success(result?.removed ? 'Removed from wishlist' : 'Added to wishlist');
    } catch (error) {
      toast.error(error || 'Failed to update wishlist');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
          <p className="text-sm text-gray-600">
            {filteredProducts.length} item{filteredProducts.length === 1 ? '' : 's'} found
          </p>
          <div className="flex items-center gap-2">
            {(selectedCategory || searchQuery) && (
              <button
                type="button"
                onClick={handleClearFilters}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 px-3 py-1 text-xs font-semibold text-gray-700 hover:border-primary-200 hover:text-primary-700 transition-colors"
              >
                Clear filters
              </button>
            )}
            {selectedCategory && (
              <span className="inline-flex items-center rounded-full bg-primary-50 px-3 py-1 text-xs font-semibold text-primary-700">
                {selectedCategory}
              </span>
            )}
            {searchQuery && (
              <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-700">
                Search: {searchQuery}
              </span>
            )}
          </div>
        </div>

        {!selectedCategory && !searchQuery && !loading && !error && filteredProducts.length > 0 ? (
          <div className="space-y-8">
            {categorizedProducts.map((section) => (
              <div key={section.category}>
                <h3 className="mb-3 text-lg font-semibold text-gray-900">{section.category}</h3>
                <ProductGrid
                  products={section.products}
                  loading={loading}
                  error={error}
                  onAddToCart={handleAddToCart}
                  onToggleWishlist={handleToggleWishlist}
                  cartItems={cartItems}
                  wishlistItems={wishlistItems}
                />
              </div>
            ))}
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            loading={loading}
            error={error}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            cartItems={cartItems}
            wishlistItems={wishlistItems}
          />
        )}
      </div>
    </div>
  );
};

export default Products;
