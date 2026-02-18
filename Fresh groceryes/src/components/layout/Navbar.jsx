import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  Search,
  X,
  Heart,
  ShoppingCart,
  User,
  LayoutGrid,
  Apple,
  Carrot,
  Milk,
  Croissant,
  Drumstick,
  Fish,
  Package,
  LogOut,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { getStoredUser, isAuthenticatedUser } from '../../utils/auth';
import { useDebounce } from '../../hooks/useDebounce';
import { productAPI } from '../../api/productAPI';

const toCategoryParam = (value = '') =>
  String(value)
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const categoryIconMap = {
  Fruits: Apple,
  Vegetables: Carrot,
  Dairy: Milk,
  Bakery: Croissant,
  'Meat & Poultry': Drumstick,
  Seafood: Fish,
};

const categoryMobileLabelMap = {
  'Meat & Poultry': 'Meat',
  'Frozen Foods': 'Frozen',
  'Pantry Staples': 'Pantry',
  'Household Essentials': 'Household',
  'Personal Care': 'Personal',
  'Breakfast & Cereal': 'Breakfast',
};

const categoryDesktopLabelMap = {
  'Household Essentials': 'Household',
};

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [categories, setCategories] = useState([]);
  const profileMenuRef = useRef(null);
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { logout: logoutUser } = useAuth();
  const authState = useSelector((state) => state.auth);
  const cartItems = useSelector((state) => state.cart.items);
  const wishlistItems = useSelector((state) => state.wishlist.items);

  const storedUser = useMemo(() => getStoredUser(), [authState.isAuthenticated, authState.user]);

  const currentUser = authState.user || storedUser;
  const userInitials = useMemo(() => {
    const name = String(currentUser?.name || '').trim();
    if (!name) return 'U';
    const parts = name.split(/\s+/).filter(Boolean);
    if (parts.length === 1) {
      return parts[0].slice(0, 2).toUpperCase();
    }
    return `${parts[0][0] || ''}${parts[parts.length - 1][0] || ''}`.toUpperCase();
  }, [currentUser?.name]);
  const isLoggedIn = isAuthenticatedUser(authState);
  const itemCount = cartItems.reduce(
    (sum, item) => (item?.productId && Number(item.quantity) > 0 ? sum + (item.quantity || 1) : sum),
    0
  );
  const wishlistCount = wishlistItems.filter((item) => item?.productId).length;
  const cartDestination = isLoggedIn ? '/cart' : '/login';
  const cartLinkState = isLoggedIn ? undefined : { from: { pathname: '/cart' } };
  const wishlistDestination = isLoggedIn ? '/wishlist' : '/login';
  const wishlistLinkState = isLoggedIn ? undefined : { from: { pathname: '/wishlist' } };
  const isProductsPage = location.pathname === '/products';
  const debouncedSearchValue = useDebounce(searchValue.trim(), 300);

  const categoryItems = useMemo(() => {
    const list = categories.length ? categories : [];
    return [
      { label: 'All Products', mobileLabel: 'All', value: '', icon: LayoutGrid },
      ...list.map((category) => ({
        label: category,
        desktopLabel: categoryDesktopLabelMap[category] || category,
        mobileLabel: categoryMobileLabelMap[category] || category,
        value: category,
        icon: categoryIconMap[category] || Package,
      })),
    ];
  }, [categories]);

  const activeCategory = useMemo(() => {
    if (!isProductsPage) {
      return '';
    }
    const categoryToken = new URLSearchParams(location.search).get('category') || '';
    if (!categoryToken) {
      return '';
    }

    return categories.find((category) => toCategoryParam(category) === categoryToken) || categoryToken;
  }, [categories, isProductsPage, location.search]);

  useEffect(() => {
    const query = new URLSearchParams(location.search).get('search') || '';
    setSearchValue(query);
  }, [location.search]);

  useEffect(() => {
    let isMounted = true;
    productAPI
      .getCategories()
      .then((list) => {
        if (!isMounted) return;
        setCategories(Array.isArray(list) ? list : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setCategories([]);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const term = debouncedSearchValue;
    if (!term) {
      setSearchSuggestions([]);
      setIsSearchLoading(false);
      return undefined;
    }

    let isMounted = true;
    setIsSearchLoading(true);

    productAPI
      .searchProducts(term, {
        limit: 6,
        category: activeCategory || undefined,
        status: 'active',
      })
      .then((response) => {
        if (!isMounted) return;
        setSearchSuggestions(Array.isArray(response?.products) ? response.products : []);
      })
      .catch(() => {
        if (!isMounted) return;
        setSearchSuggestions([]);
      })
      .finally(() => {
        if (!isMounted) return;
        setIsSearchLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory, debouncedSearchValue]);

  useEffect(() => {
    if (!isProfileMenuOpen) {
      return undefined;
    }

    const handleClickOutside = (event) => {
      if (profileMenuRef.current && !profileMenuRef.current.contains(event.target)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isProfileMenuOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      const clickedInsideDesktop = desktopSearchRef.current?.contains(event.target);
      const clickedInsideMobile = mobileSearchRef.current?.contains(event.target);
      if (!clickedInsideDesktop && !clickedInsideMobile) {
        setIsSearchOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    logoutUser();
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    navigate('/');
  };

  const handleMyOrdersClick = () => {
    setIsMenuOpen(false);
    setIsProfileMenuOpen(false);
    navigate('/my-orders');
  };

  const buildProductsUrl = ({ category = '', search = '' } = {}) => {
    const params = new URLSearchParams();
    const trimmedSearch = search.trim();

    if (category) {
      params.set('category', toCategoryParam(category));
    }
    if (trimmedSearch) {
      params.set('search', trimmedSearch);
    }

    const queryString = params.toString();
    return queryString ? `/products?${queryString}` : '/products';
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    const trimmedSearch = searchValue.trim();
    const isObjectId = /^[a-fA-F0-9]{24}$/.test(trimmedSearch);

    if (isObjectId) {
      navigate(`/product/${trimmedSearch}`);
    } else {
      navigate(buildProductsUrl({ category: activeCategory, search: trimmedSearch }));
    }

    setIsSearchOpen(false);
    setIsMenuOpen(false);
  };

  const handleCategorySelect = (category) => {
    setSearchValue('');
    setSearchSuggestions([]);
    navigate(buildProductsUrl({ category, search: '' }));
    setIsMenuOpen(false);
  };

  const handleClearSearch = () => {
    const hasSearchParam = Boolean(new URLSearchParams(location.search).get('search'));
    setSearchValue('');
    setSearchSuggestions([]);
    setIsSearchOpen(false);

    if (isProductsPage && hasSearchParam) {
      navigate(buildProductsUrl({ category: activeCategory, search: '' }));
    }
  };

  const handleSuggestionSelect = (productId) => {
    if (!productId) return;
    navigate(`/product/${productId}`);
    setIsSearchOpen(false);
    setIsMenuOpen(false);
  };

  return (
    <nav className="relative bg-white shadow-sm border-b border-gray-200 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-3">
          {/* Logo and Brand */}
          <div className="flex items-center shrink-0">
            <Link to="/" className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-blue-500 rounded-xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-lg">🛒</span>
              </div>
              <span className="text-xl font-bold text-gray-900 hidden sm:block">
                Fresh Grocery
              </span>
            </Link>
          </div>

          {/* Desktop Search */}
          <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center flex-1 justify-center px-4">
            <div className="relative w-full max-w-2xl" ref={desktopSearchRef}>
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5 pointer-events-none" />
              <input
                type="text"
                value={searchValue}
                onChange={(event) => setSearchValue(event.target.value)}
                onFocus={() => setIsSearchOpen(true)}
                placeholder="Search products..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 px-11 pr-20 py-3 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              {searchValue && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute right-10 top-1/2 -translate-y-1/2 rounded-full text-gray-400 hover:text-gray-700 p-1 transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-white text-gray-500 hover:text-primary-600 p-1.5 transition-colors"
                aria-label="Search products"
              >
                <Search className="h-4 w-4" />
              </button>

              {isSearchOpen && searchValue.trim() && (
                <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                  {isSearchLoading ? (
                    <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                  ) : searchSuggestions.length > 0 ? (
                    searchSuggestions.map((product) => (
                      <button
                        key={product.id}
                        type="button"
                        onMouseDown={(event) => event.preventDefault()}
                        onClick={() => handleSuggestionSelect(product.id)}
                        className="block w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                      >
                        <p className="line-clamp-1 text-sm font-semibold text-gray-900">{product.name}</p>
                        <p className="line-clamp-1 text-xs text-gray-500">
                          {product.category} | ID: {product.id}
                        </p>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                  )}
                </div>
              )}
            </div>
          </form>

          <div className="hidden md:flex items-center gap-5 shrink-0">
            <Link
              to={wishlistDestination}
              state={wishlistLinkState}
              className="inline-flex flex-col items-center text-gray-600 hover:text-primary-600 transition-colors relative"
              title="Wishlist"
            >
              <Heart className="h-5 w-5" />
              <span className="text-[11px] mt-1 font-medium">Wishlist</span>
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>

            <Link
              to={cartDestination}
              state={cartLinkState}
              className="inline-flex flex-col items-center text-gray-600 hover:text-primary-600 transition-colors relative"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="text-[11px] mt-1 font-medium">Cart</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            
            {isLoggedIn ? (
              <div className="relative" ref={profileMenuRef}>
                <button
                  type="button"
                  onClick={() => setIsProfileMenuOpen((prev) => !prev)}
                  className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-gray-700 transition-colors hover:border-primary-300 hover:text-primary-600"
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                >
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                    <User className="h-4 w-4" />
                  </span>
                  <span className="max-w-28 truncate text-sm font-medium">{currentUser.name}</span>
                  <ChevronDown className="h-4 w-4" />
                </button>

                {isProfileMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-72 rounded-2xl border border-gray-200 bg-white p-2 shadow-xl z-50">
                    <div className="flex items-center gap-3 px-3 py-3 border-b border-gray-100">
                      <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-700">
                        <User className="h-5 w-5" />
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{currentUser.name}</p>
                        <p className="truncate text-xs text-gray-500">{currentUser.email}</p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handleMyOrdersClick}
                        className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-gray-50"
                      >
                        <Package className="h-4 w-4" />
                        My Orders
                      </button>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-red-600 transition-colors hover:bg-red-50"
                      >
                        <LogOut className="h-4 w-4" />
                        Log out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Link to="/login" className="inline-flex items-center gap-1.5 text-gray-700 hover:text-primary-600">
                  <User className="h-5 w-5" />
                  <span className="text-sm font-medium">Login</span>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-3">
            <Link
              to={wishlistDestination}
              state={wishlistLinkState}
              className="relative inline-flex items-center text-gray-700 hover:text-primary-600"
              title="Wishlist"
            >
              <Heart className="h-5 w-5" />
              {wishlistCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {wishlistCount}
                </span>
              )}
            </Link>
            <Link
              to={cartDestination}
              state={cartLinkState}
              className="relative inline-flex items-center text-gray-700 hover:text-primary-600"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-primary-600 text-white text-[10px] rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Link>
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="text-gray-700 hover:text-primary-600 transition-colors"
                aria-label="Toggle navigation menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>

              {/* Mobile Navigation */}
              {isMenuOpen && (
                <div className="absolute right-0 top-full mt-2 z-50 w-[50vw] h-auto rounded-xl border border-gray-200 bg-white shadow-lg">
                  <div className="px-4 py-3 space-y-2">
                    <Link
                      to="/"
                      className="block py-2 text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Home
                    </Link>
                    <Link
                      to="/products"
                      className="block py-2 text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Products
                    </Link>
                    <Link
                      to="/about"
                      className="block py-2 text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      About
                    </Link>
                    <Link
                      to={wishlistDestination}
                      state={wishlistLinkState}
                      className="block py-2 text-gray-700 hover:text-primary-600 transition-colors"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Wishlist
                    </Link>
                    <Link
                      to={cartDestination}
                      state={cartLinkState}
                      className="block py-2 text-gray-700 hover:text-primary-600 transition-colors relative"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      Cart
                      {itemCount > 0 && (
                        <span className="absolute -top-1 -right-6 bg-primary-600 text-white text-xs rounded-full h-5 min-w-5 px-1 flex items-center justify-center">
                          {itemCount}
                        </span>
                      )}
                    </Link>

                    {isLoggedIn ? (
                      <>
                        <Link
                          to="/my-orders"
                          className="block py-2 text-gray-700 hover:text-primary-600 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          My Orders
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="w-full text-left py-2 text-gray-700 hover:text-primary-600 transition-colors"
                        >
                          Logout
                        </button>
                        <div className="mt-2 flex items-center gap-3 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2">
                          <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-bold text-primary-700">
                            {userInitials}
                          </span>
                          <span className="min-w-0 truncate text-sm font-medium text-gray-700">{currentUser.name}</span>
                        </div>
                      </>
                    ) : (
                      <>
                        <Link
                          to="/login"
                          className="block py-2 text-gray-700 hover:text-primary-600 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          to="/register"
                          className="block py-2 text-gray-700 hover:text-primary-600 transition-colors"
                          onClick={() => setIsMenuOpen(false)}
                        >
                          Sign Up
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="md:hidden pb-3 space-y-2">
          <form onSubmit={handleSearchSubmit} className="relative" ref={mobileSearchRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4 pointer-events-none" />
            <input
              type="text"
              value={searchValue}
              onChange={(event) => setSearchValue(event.target.value)}
              onFocus={() => setIsSearchOpen(true)}
              placeholder="Search products..."
              className="w-full rounded-full border border-gray-200 bg-gray-50 px-9 pr-16 py-2 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
            {searchValue && (
              <button
                type="button"
                onClick={handleClearSearch}
                className="absolute right-9 top-1/2 -translate-y-1/2 rounded-full text-gray-400 hover:text-gray-700 p-1 transition-colors"
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <button
              type="submit"
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white text-gray-500 hover:text-primary-600 p-1.5 transition-colors"
              aria-label="Search products"
            >
              <Search className="h-4 w-4" />
            </button>

            {isSearchOpen && searchValue.trim() && (
              <div className="absolute z-50 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                {isSearchLoading ? (
                  <div className="px-4 py-3 text-sm text-gray-500">Searching...</div>
                ) : searchSuggestions.length > 0 ? (
                  searchSuggestions.map((product) => (
                    <button
                      key={product.id}
                      type="button"
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSuggestionSelect(product.id)}
                      className="block w-full border-b border-gray-100 px-4 py-3 text-left last:border-b-0 hover:bg-gray-50"
                    >
                      <p className="line-clamp-1 text-sm font-semibold text-gray-900">{product.name}</p>
                      <p className="line-clamp-1 text-xs text-gray-500">
                        {product.category} | ID: {product.id}
                      </p>
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-3 text-sm text-gray-500">No products found</div>
                )}
              </div>
            )}
          </form>
        </div>

        {/* Category Navigation - Mobile and Desktop */}
        <div className="sticky top-0 z-50 bg-white border-t border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4">
            {/* Mobile Categories - Hidden on desktop */}
            <div className="md:hidden hide-scrollbar flex items-center gap-2 overflow-x-auto py-3">
              {categoryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeCategory === item.value && isProductsPage;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleCategorySelect(item.value)}
                    className={`flex h-10 shrink-0 items-center gap-1 rounded-lg border px-3 text-[10px] font-semibold transition-colors ${
                      isActive
                        ? 'border-primary-300 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:text-primary-700'
                    }`}
                  >
                    <span
                      className={`inline-flex h-5 w-5 items-center justify-center rounded-full ${
                        isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="h-2.5 w-2.5" />
                    </span>
                    <span className="whitespace-nowrap">{item.mobileLabel || item.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Desktop Categories - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 overflow-x-auto pb-4">
              {categoryItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeCategory === item.value && isProductsPage;

                return (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => handleCategorySelect(item.value)}
                    className={`flex min-w-[140px] items-center justify-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors ${
                      isActive
                        ? 'border-primary-300 bg-primary-50 text-primary-700'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-primary-200 hover:text-primary-700'
                    }`}
                  >
                    <span
                      className={`inline-flex h-7 w-7 items-center justify-center rounded-full ${
                        isActive ? 'bg-primary-100 text-primary-700' : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </span>
                    <span className="whitespace-nowrap">{item.desktopLabel || item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </nav>
  );
};

export default Navbar;
