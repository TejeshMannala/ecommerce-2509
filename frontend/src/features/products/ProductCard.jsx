import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ShoppingBag, Star } from 'lucide-react';
import { applyImageFallback, resolveImageUrl } from '../../utils/image';

const ProductCard = ({
  product,
  onAddToCart,
  onToggleWishlist,
  isLoading = false,
  isInCart = false,
  isInWishlist = false,
}) => {
  const { id, name, price, image, category, inStock, rating, reviews } = product;

  const formatPrice = (value) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);

  const averageRating = Number(rating || 4.2).toFixed(1);
  const reviewCount = Number(reviews || 120);
  const productImageUrl = resolveImageUrl(image, {
    width: 640,
    height: 480,
    text: name || 'Product',
  });

  return (
    <article className="group overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm transition-shadow duration-200 hover:shadow-md">
      <div className="relative">
        <Link to={`/product/${id}`} className="block bg-gray-100">
          <img
            src={productImageUrl}
            alt={name}
            onError={(event) =>
              applyImageFallback(event, {
                width: 640,
                height: 480,
                text: name || 'Product',
              })
            }
            className="h-20 sm:h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </Link>

        <button
          type="button"
          onClick={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onToggleWishlist?.(product);
          }}
          className="absolute right-2 top-2 inline-flex h-7 w-7 sm:h-9 sm:w-9 items-center justify-center rounded-full bg-white/90 text-gray-500 shadow-sm ring-1 ring-gray-200 transition-colors hover:text-primary-600"
          aria-label="Save to wishlist"
        >
          <Heart className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${isInWishlist ? 'fill-red-500 text-red-500' : ''}`} />
        </button>

      </div>

      <div className="p-1.5 sm:p-2">
        <div className="mb-1.5 flex items-center justify-between gap-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-gray-500">
            {category || 'General'}
          </p>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
            <span className="font-semibold text-gray-700">{averageRating}</span>
            <span>({reviewCount})</span>
          </div>
        </div>

        <Link
          to={`/product/${id}`}
          className="line-clamp-1 text-sm sm:text-base font-semibold text-gray-900 transition-colors hover:text-primary-700"
        >
          {name}
        </Link>

        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-xl sm:text-2xl font-extrabold tracking-tight text-gray-900">
            {formatPrice(price)}
          </span>
        </div>

        <div className="mt-2 flex justify-end sm:hidden">
          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            disabled={!inStock || isLoading || isInCart || !onAddToCart}
            className={`inline-flex h-7 w-7 items-center justify-center rounded-full shadow-sm ring-1 transition-colors ${
              !inStock || !onAddToCart
                ? 'cursor-not-allowed bg-gray-100 text-gray-400 ring-gray-200'
                : isInCart
                  ? 'cursor-not-allowed bg-primary-100 text-primary-700 ring-primary-200'
                  : 'bg-primary-600 text-white hover:bg-primary-700 ring-primary-600/20'
            }`}
            aria-label="Add to cart"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="mt-2.5 hidden sm:block">
          <button
            type="button"
            onClick={() => onAddToCart?.(product)}
            disabled={!inStock || isLoading || isInCart || !onAddToCart}
            className={`w-full rounded-lg px-3 py-2 text-sm font-semibold transition-colors ${
              !inStock || !onAddToCart
                ? 'cursor-not-allowed bg-gray-100 text-gray-400'
                : isInCart
                  ? 'cursor-not-allowed bg-primary-100 text-primary-700'
                  : 'bg-primary-600 text-white hover:bg-primary-700'
            }`}
          >
            {!inStock ? 'Out of Stock' : isLoading ? 'Adding...' : isInCart ? 'In Cart' : 'Add to Cart'}
          </button>
        </div>
      </div>
    </article>
  );
};

export default ProductCard;
