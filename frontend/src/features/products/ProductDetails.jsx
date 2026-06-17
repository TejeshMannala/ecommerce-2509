import React, { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { Star, StarHalf, ShoppingCart, Plus, Minus, ArrowLeft, Heart, ThumbsUp, Calendar, Edit3, Trash2, X, Check, MessageSquare } from 'lucide-react';
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
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [ratingBreakdown, setRatingBreakdown] = useState({});
  const [reviewPagination, setReviewPagination] = useState({ total: 0, page: 1, totalPages: 0 });
  const [userReview, setUserReview] = useState(null);
  const [canReview, setCanReview] = useState({ canReview: false, reason: null });
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, title: '', comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [editingReviewId, setEditingReviewId] = useState(null);

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

  const loadReviews = useCallback(async (page = 1) => {
    setReviewsLoading(true);
    try {
      const data = await productAPI.getProductReviews(id, { page, limit: 5 });
      if (data) {
        setReviews(data.reviews || []);
        setRatingBreakdown(data.ratingBreakdown || {});
        setReviewPagination(data.pagination || { total: 0, page: 1, totalPages: 0 });
      }
    } catch {
      setReviews([]);
    } finally {
      setReviewsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    if (id) {
      loadReviews(1);
    }
  }, [id, loadReviews]);

  useEffect(() => {
    if (!id || !isLoggedIn) {
      setUserReview(null);
      setCanReview({ canReview: false, reason: null });
      return;
    }

    let isMounted = true;

    productAPI.getUserReviewForProduct(id).then((review) => {
      if (isMounted) setUserReview(review);
    }).catch(() => {});

    productAPI.checkCanReview(id).then((result) => {
      if (isMounted) setCanReview(result);
    }).catch(() => {});

    return () => { isMounted = false; };
  }, [id, isLoggedIn]);

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

  const handleReviewSubmit = async (event) => {
    event.preventDefault();
    if (!reviewForm.rating || !reviewForm.comment.trim()) {
      toast.error('Please provide a rating and comment');
      return;
    }

    setReviewSubmitting(true);
    try {
      if (editingReviewId) {
        await productAPI.updateReview(editingReviewId, reviewForm);
        toast.success('Review updated');
      } else {
        await productAPI.createReview(id, reviewForm);
        toast.success('Review submitted');
      }
      setShowReviewForm(false);
      setEditingReviewId(null);
      setReviewForm({ rating: 5, title: '', comment: '' });
      const review = await productAPI.getUserReviewForProduct(id);
      setUserReview(review);
      loadReviews(1);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to submit review');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const handleEditReview = (review) => {
    setEditingReviewId(review._id);
    setReviewForm({ rating: review.rating, title: review.title || '', comment: review.comment });
    setShowReviewForm(true);
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm('Delete this review?')) return;
    try {
      await productAPI.deleteReview(reviewId);
      toast.success('Review deleted');
      setUserReview(null);
      setCanReview((prev) => ({ ...prev, canReview: true }));
      loadReviews(1);
    } catch (error) {
      toast.error(error?.response?.data?.message || 'Failed to delete review');
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

      {/* Reviews Section */}
      <section className="mt-12 border-t border-gray-200 pt-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <MessageSquare className="h-6 w-6" />
            Reviews ({reviewPagination.total || product.reviews || 0})
          </h2>
          {isLoggedIn ? (
            canReview.canReview && !userReview ? (
              <Button variant="primary" size="sm" onClick={() => { setShowReviewForm(true); setEditingReviewId(null); setReviewForm({ rating: 5, title: '', comment: '' }); }}>
                Write a Review
              </Button>
            ) : null
          ) : (
            <Button variant="ghost" size="sm" onClick={() => navigate('/login', { state: { from: location } })}>
              Sign in to review
            </Button>
          )}
        </div>

        {/* User's existing review */}
        {userReview && !showReviewForm && (
          <div className="mb-6 rounded-lg border border-primary-200 bg-primary-50 p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-semibold text-primary-800">Your Review</span>
              <div className="flex gap-2">
                <button onClick={() => handleEditReview(userReview)} className="text-sm text-primary-700 hover:text-primary-900 flex items-center gap-1">
                  <Edit3 className="h-3.5 w-3.5" /> Edit
                </button>
                <button onClick={() => handleDeleteReview(userReview._id)} className="text-sm text-red-600 hover:text-red-800 flex items-center gap-1">
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </button>
              </div>
            </div>
            <div className="flex items-center gap-1 mb-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star key={star} className={`h-4 w-4 ${star <= userReview.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
              ))}
              {userReview.isVerifiedPurchase && (
                <span className="ml-2 inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                  <Check className="h-3 w-3" /> Verified Purchase
                </span>
              )}
            </div>
            {userReview.title && <p className="text-sm font-semibold text-gray-900">{userReview.title}</p>}
            <p className="text-sm text-gray-700 mt-1">{userReview.comment}</p>
          </div>
        )}

        {/* Review Form */}
        {showReviewForm && (
          <form onSubmit={handleReviewSubmit} className="mb-6 rounded-lg border border-gray-200 bg-white p-4 sm:p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {editingReviewId ? 'Edit Your Review' : 'Write a Review'}
              </h3>
              <button type="button" onClick={() => { setShowReviewForm(false); setEditingReviewId(null); }} className="text-gray-400 hover:text-gray-600">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Rating</label>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button key={star} type="button" onClick={() => setReviewForm((prev) => ({ ...prev, rating: star }))}>
                    <Star className={`h-8 w-8 ${star <= reviewForm.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'} hover:text-yellow-400 transition-colors`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-4">
              <label htmlFor="review-title" className="block text-sm font-medium text-gray-700 mb-1">Title (optional)</label>
              <input
                id="review-title"
                type="text"
                value={reviewForm.title}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Summarize your experience"
                maxLength={100}
              />
            </div>

            <div className="mb-4">
              <label htmlFor="review-comment" className="block text-sm font-medium text-gray-700 mb-1">Comment</label>
              <textarea
                id="review-comment"
                value={reviewForm.comment}
                onChange={(e) => setReviewForm((prev) => ({ ...prev, comment: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Share your thoughts about this product"
                rows={4}
                maxLength={2000}
                required
              />
            </div>

            <div className="flex gap-3 justify-end">
              <Button variant="ghost" type="button" onClick={() => { setShowReviewForm(false); setEditingReviewId(null); }}>
                Cancel
              </Button>
              <Button variant="primary" type="submit" disabled={reviewSubmitting}>
                {reviewSubmitting ? 'Submitting...' : editingReviewId ? 'Update Review' : 'Submit Review'}
              </Button>
            </div>
          </form>
        )}

        {/* Rating Breakdown */}
        {Object.keys(ratingBreakdown).length > 0 && (
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-gray-200 bg-white p-4">
            <div className="text-center sm:text-left">
              <p className="text-4xl font-bold text-gray-900">{product.rating || 0}</p>
              <div className="flex items-center justify-center sm:justify-start gap-1 mt-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star key={star} className={`h-4 w-4 ${star <= Math.round(product.rating || 0) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-sm text-gray-500 mt-1">{reviewPagination.total || product.reviews || 0} reviews</p>
            </div>
            <div className="space-y-1.5">
              {[5, 4, 3, 2, 1].map((star) => {
                const max = Math.max(...Object.values(ratingBreakdown), 1);
                const count = ratingBreakdown[star] || 0;
                const pct = (count / max) * 100;
                return (
                  <div key={star} className="flex items-center gap-2 text-sm">
                    <span className="w-8 text-right text-gray-600">{star}</span>
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="w-8 text-gray-500 text-xs">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Reviews List */}
        {reviewsLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-24 rounded-lg bg-gray-100 animate-pulse" />
            ))}
          </div>
        ) : reviews.length > 0 ? (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                      <span className="text-sm font-semibold text-primary-700">
                        {(review.user?.name || 'A')[0].toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{review.user?.name || 'Anonymous'}</p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star key={star} className={`h-3 w-3 ${star <= review.rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} />
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {review.isVerifiedPurchase && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-700 font-medium">
                        <Check className="h-3 w-3" /> Verified
                      </span>
                    )}
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(review.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                {review.title && <p className="text-sm font-semibold text-gray-900 mb-1">{review.title}</p>}
                <p className="text-sm text-gray-700">{review.comment}</p>
              </div>
            ))}

            {reviewPagination.totalPages > 1 && (
              <div className="flex justify-center gap-2 mt-4">
                {Array.from({ length: reviewPagination.totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => loadReviews(page)}
                    className={`px-3 py-1 text-sm rounded-lg ${
                      page === reviewPagination.page
                        ? 'bg-primary-600 text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-white p-6 text-center">
            <MessageSquare className="mx-auto h-8 w-8 text-gray-400 mb-2" />
            <p className="text-gray-600 text-sm">No reviews yet. Be the first to review this product!</p>
          </div>
        )}
      </section>

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
