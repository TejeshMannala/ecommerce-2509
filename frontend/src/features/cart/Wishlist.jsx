import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import toast from 'react-hot-toast';
import Button from '../../components/common/Button';
import { addCartItemAsync } from '../../redux/slices/cartSlice';
import { fetchWishlist, removeWishlistItemAsync } from '../../redux/slices/wishlistSlice';
import { applyImageFallback, resolveImageUrl } from '../../utils/image';

const Wishlist = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const wishlistItems = useSelector((state) => state.wishlist.items);
  const cartItems = useSelector((state) => state.cart.items);

  useEffect(() => {
    dispatch(fetchWishlist());
  }, [dispatch]);

  const visibleWishlistItems = wishlistItems.filter(
    (item) => item?.productId && item?.name
  );

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);

  const handleRemove = async (productId) => {
    try {
      await dispatch(removeWishlistItemAsync(productId)).unwrap();
      toast.success('Removed from wishlist');
    } catch (error) {
      toast.error(error || 'Failed to remove from wishlist');
    }
  };

  const handleAddToCart = async (item) => {
    const isInCart = cartItems.some((cartItem) => cartItem.productId === item.productId);
    if (isInCart) {
      toast('Item is already in cart');
      return;
    }

    try {
      await dispatch(
        addCartItemAsync({
          productId: item.productId,
          quantity: 1,
          item: {
            productId: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: 1,
            maxQuantity: item.maxQuantity || 99,
            inStock: item.inStock !== false,
          },
        })
      ).unwrap();
      toast.success(`${item.name} added to cart`);
    } catch (error) {
      toast.error(error || 'Failed to add item to cart');
    }
  };

  if (!visibleWishlistItems.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-50 sm:h-16 sm:w-16">
            <Heart className="h-8 w-8 text-red-500" />
          </div>
          <h1 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">Your wishlist is empty</h1>
          <p className="mb-6 text-sm text-gray-600 sm:text-base">
            Save products you like and find them quickly later.
          </p>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Wishlist</h1>
            <p className="text-gray-600">{visibleWishlistItems.length} saved items</p>
          </div>
          <Button variant="ghost" onClick={() => navigate('/products')}>
            Continue Shopping
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5">
          {visibleWishlistItems.map((item) => (
            <article
              key={item.productId}
              className="home-product-card group"
            >
              <div className="relative">
                <Link to={`/product/${item.productId}`} className="block bg-gray-100">
                  <img
                    src={resolveImageUrl(item.image, {
                      width: 640,
                      height: 480,
                      text: item.name || 'Product',
                    })}
                    alt={item.name}
                    onError={(event) =>
                      applyImageFallback(event, {
                        width: 640,
                        height: 480,
                        text: item.name || 'Product',
                      })
                    }
                    className="w-full h-20 sm:h-48 object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </Link>

                <button
                  type="button"
                  onClick={() => handleRemove(item.productId)}
                  className="absolute right-2 top-2 inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm ring-1 ring-gray-200 transition-colors hover:text-red-600"
                  aria-label="Remove from wishlist"
                >
                  <Heart className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-500 fill-red-500" />
                </button>

                <button
                  type="button"
                  onClick={() => handleAddToCart(item)}
                  className="absolute right-2 bottom-2 inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 text-gray-600 shadow-sm ring-1 ring-gray-200 transition-colors hover:text-primary-600"
                  aria-label="Add to cart"
                >
                  <ShoppingCart className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>

              <div className="p-1.5 sm:p-2">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
                  {item.category || 'General'}
                </p>
                <Link
                  to={`/product/${item.productId}`}
                  className="mt-1 line-clamp-1 block text-sm sm:text-base font-semibold text-gray-900 hover:text-primary-700"
                >
                  {item.name}
                </Link>

                <div className="flex items-center gap-1 mt-1.5 text-xs text-gray-500">
                  <Star className="h-3.5 w-3.5 text-yellow-500 fill-yellow-500" />
                  <span className="font-semibold text-gray-700">{Number(item.rating || 4.2).toFixed(1)}</span>
                  <span>({item.reviews || 120})</span>
                </div>

                <div className="mt-1.5">
                  <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">{formatPrice(item.price)}</span>
                </div>

              </div>
            </article>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Wishlist;
