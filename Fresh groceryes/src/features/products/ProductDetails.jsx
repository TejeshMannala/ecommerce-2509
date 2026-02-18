import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Star, StarHalf, ShoppingCart, Plus, Minus, ArrowLeft, Heart } from 'lucide-react';
import toast from 'react-hot-toast';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../../components/common/Button';
import Modal from '../../components/common/Modal';
import { applyImageFallback, resolveImageUrl } from '../../utils/image';
import { addCartItemAsync } from '../../redux/slices/cartSlice';
import { toggleWishlistItemAsync } from '../../redux/slices/wishlistSlice';
import { productAPI } from '../../api/productAPI';
import { buildReturnToLocation, isAuthenticatedUser } from '../../utils/auth';

const ProductDetails = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const authState = useSelector((state) => state.auth);
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const isLoggedIn = isAuthenticatedUser(authState);
  const [quantity, setQuantity] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const getProductId = (item) => item?.id || item?._id;
  const toDisplayText = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (Array.isArray(value)) {
      return value.map((entry) => toDisplayText(entry)).filter(Boolean).join(', ');
    }
    if (typeof value === 'object') {
      if ('value' in value && 'unit' in value) {
        return `${value.value} ${value.unit}`.trim();
      }
      if (['length', 'width', 'height'].every((key) => key in value)) {
        const unit = value.unit ? ` ${value.unit}` : '';
        return `${value.length} x ${value.width} x ${value.height}${unit}`;
      }
      if ('unit' in value && Object.keys(value).length === 1) {
        return String(value.unit);
      }
      return JSON.stringify(value);
    }
    return String(value);
  };

  const getDiscountPercentage = (item) => {
    const discount = item?.discount;
    if (typeof discount === 'number') return discount;
    if (discount && typeof discount === 'object' && typeof discount.percentage === 'number') {
      return discount.percentage;
    }
    return 0;
  };

  useEffect(() => {
    setQuantity(1);
    setIsModalOpen(false);
    setLoading(true);
    setProduct(null);

    let isMounted = true;
    productAPI
      .getProductById(id)
      .then((response) => {
        if (isMounted) {
          const incomingProduct = response?.product || null;
          if (!incomingProduct) {
            setProduct(null);
            return;
          }

          const normalizedImage =
            incomingProduct.image ||
            incomingProduct.images?.[0]?.url ||
            (typeof incomingProduct.images?.[0] === 'string' ? incomingProduct.images?.[0] : '');

          setProduct({
            ...incomingProduct,
            id: getProductId(incomingProduct),
            image: normalizedImage,
          });
        }
      })
      .catch(() => {
        if (isMounted) {
          setProduct(null);
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const getDiscountedPrice = () => {
    if (!product) return 0;
    const discountPercent = getDiscountPercentage(product);
    if (!discountPercent) return product.price;
    return product.price - (product.price * discountPercent / 100);
  };

  const requireLogin = () => {
    if (isLoggedIn) {
      return true;
    }

    toast.error('Please sign in to continue');
    navigate('/login', { state: { from: buildReturnToLocation(location) } });
    return false;
  };

  const handleAddToCart = async () => {
    if (!requireLogin()) {
      return;
    }

    const discountPercent = getDiscountPercentage(product);
    const discountedPrice =
      discountPercent > 0 ? product.price - (product.price * discountPercent) / 100 : product.price;

    try {
      await dispatch(
        addCartItemAsync({
          productId: product.id,
          quantity,
          item: {
            productId: product.id,
            name: product.name,
            price: discountedPrice,
            image: product.image || product.images?.[0] || '/api/placeholder/100/100',
            quantity,
            maxQuantity: product.stock || 99,
            inStock: product.inStock,
          },
        })
      ).unwrap();
      setIsModalOpen(true);
    } catch (error) {
      toast.error(error || 'Failed to add item to cart');
    }
  };

  const handleQuantityChange = (amount) => {
    if (!product) return;
    const max = Math.min(product.stock || 99, 99);
    setQuantity((current) => Math.max(1, Math.min(max, current + amount)));
  };

  const handleBuyNow = async () => {
    if (!requireLogin()) {
      return;
    }

    const discountPercent = getDiscountPercentage(product);
    const discountedPrice =
      discountPercent > 0 ? product.price - (product.price * discountPercent) / 100 : product.price;

    try {
      await dispatch(
        addCartItemAsync({
          productId: product.id,
          quantity,
          item: {
            productId: product.id,
            name: product.name,
            price: discountedPrice,
            image: product.image || product.images?.[0] || '/api/placeholder/100/100',
            quantity,
            maxQuantity: product.stock || 99,
            inStock: product.inStock,
          },
        })
      ).unwrap();
      navigate('/checkout');
    } catch (error) {
      toast.error(error || 'Failed to add item to cart');
    }
  };

  const isWishlisted = product
    ? wishlistItems.some((item) => String(item.productId) === String(product.id))
    : false;

  const handleToggleWishlist = async () => {
    if (!product) {
      return;
    }

    if (!requireLogin()) {
      return;
    }

    const discountPercent = getDiscountPercentage(product);
    const discountedPrice =
      discountPercent > 0 ? product.price - (product.price * discountPercent) / 100 : product.price;

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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center max-w-md mx-4">
          <p className="text-gray-700">Loading product...</p>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center max-w-md mx-4">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Product not found</h1>
          <p className="text-gray-600 mb-6">
            This product is unavailable or the link is incorrect.
          </p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Back to Products
          </Button>
        </div>
      </div>
    );
  }

  const fullStars = Math.floor(product.rating);
  const hasHalfStar = product.rating - fullStars >= 0.5;
  const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  const availableUnits = product.stock || 50;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="inline-flex items-center text-sm font-medium text-primary-700 hover:text-primary-800"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back to Products
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Product Images */}
          <div className="space-y-4">
            <div className="bg-white rounded-lg p-4">
              <img 
                src={resolveImageUrl(product.images?.[0] || product.image, {
                  width: 600,
                  height: 600,
                  text: product.name || 'Product',
                })} 
                alt={product.name}
                onError={(event) =>
                  applyImageFallback(event, {
                    width: 600,
                    height: 600,
                    text: product.name || 'Product',
                  })
                }
                className="w-full h-96 object-cover rounded-lg"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center space-x-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
                {getDiscountPercentage(product) > 0 && (
                  <span className="sale-badge">-{getDiscountPercentage(product)}%</span>
                )}
              </div>
              <div className="flex items-center space-x-4">
                <div className="flex items-center">
                  {[...Array(fullStars)].map((_, i) => (
                    <Star key={`full-${i}`} className="h-5 w-5 text-yellow-400" />
                  ))}
                  {hasHalfStar && <StarHalf className="h-5 w-5 text-yellow-400" />}
                  {[...Array(emptyStars)].map((_, i) => (
                    <Star key={`empty-${i}`} className="h-5 w-5 text-gray-300" />
                  ))}
                  <span className="ml-2 text-gray-600">({product.reviews} reviews)</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div>
                <span className="text-2xl font-bold text-gray-900">{formatPrice(getDiscountedPrice())}</span>
                {getDiscountPercentage(product) > 0 && (
                  <span className="ml-2 text-lg text-gray-500 line-through">{formatPrice(product.price)}</span>
                )}
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                product.inStock ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {product.inStock ? 'In Stock' : 'Out of Stock'}
              </div>
            </div>

            <p className="text-gray-700 leading-relaxed">{product.description}</p>

            {/* Quantity Selector */}
            <div className="flex items-center space-x-4">
              <label className="text-sm font-medium text-gray-700">Quantity:</label>
              <div className="flex items-center border border-gray-300 rounded-lg">
                <button
                  onClick={() => handleQuantityChange(-1)}
                  disabled={quantity <= 1}
                  className="p-2 hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
                <span className="px-4 py-2 text-lg font-medium">{quantity}</span>
                <button
                  onClick={() => handleQuantityChange(1)}
                  className="p-2 hover:bg-gray-100"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </div>
              <span className="text-sm text-gray-500">Available: {availableUnits} units</span>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                variant="primary"
                size="lg"
                onClick={handleAddToCart}
                disabled={!product.inStock}
                className="flex-1 max-[350px]:px-3 max-[350px]:py-2 max-[350px]:text-sm"
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={handleBuyNow}
                disabled={!product.inStock}
                className="flex-1 max-[350px]:px-3 max-[350px]:py-2 max-[350px]:text-sm"
              >
                Buy Now
              </Button>
              <Button
                variant="ghost"
                size="lg"
                onClick={handleToggleWishlist}
                className={`sm:w-auto max-[350px]:px-3 max-[350px]:py-2 max-[350px]:text-sm ${isWishlisted ? 'text-red-600 hover:text-red-700' : ''}`}
              >
                <Heart className={`h-5 w-5 mr-2 ${isWishlisted ? 'fill-red-500 text-red-500' : ''}`} />
                {isWishlisted ? 'Saved' : 'Save'}
              </Button>
            </div>

            {/* Product Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3">Specifications</h3>
                <div className="space-y-2">
                  {Object.entries(product.specifications || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">{toDisplayText(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3">Nutritional Info</h3>
                <div className="space-y-2">
                  {Object.entries(product.nutritionalInfo || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between text-sm">
                      <span className="text-gray-600">{key}:</span>
                      <span className="font-medium">{toDisplayText(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Success Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Added to Cart"
        size="sm"
      >
        <div className="text-center py-4">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="h-8 w-8 text-green-600" />
          </div>
          <p className="text-gray-900 font-semibold">
            {quantity} {product.name} added to your cart
          </p>
          <div className="mt-4 space-x-3">
            <Button
              variant="primary"
              onClick={() => {
                setIsModalOpen(false);
                navigate('/cart');
              }}
            >
              View Cart
            </Button>
            <Button
              variant="ghost"
              onClick={() => setIsModalOpen(false)}
            >
              Continue Shopping
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProductDetails;
