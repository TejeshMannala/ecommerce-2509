import React from 'react';
import ProductCard from './ProductCard';
import Loader from '../../components/common/Loader';

const ProductGrid = ({ 
  products, 
  loading, 
  error, 
  onAddToCart, 
  onToggleWishlist,
  cartItems = [],
  wishlistItems = [],
  className = ''
}) => {
  if (loading) {
    return (
      <div className={`flex justify-center items-center py-12 ${className}`}>
        <Loader size="lg" text="Loading products..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6">
          <p className="text-red-600 font-medium">Error loading products</p>
          <p className="text-red-500 text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <p className="text-gray-600 font-medium">No products found</p>
          <p className="text-gray-500 text-sm mt-2">Try adjusting your filters or check back later</p>
        </div>
      </div>
    );
  }

  const isInCart = (productId) => {
    return cartItems.some(item => item.productId === productId);
  };

  const isInWishlist = (productId) => {
    return wishlistItems.some((item) => item.productId === productId);
  };

  return (
    <div className={`grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 ${className}`}>
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onAddToCart={onAddToCart}
          onToggleWishlist={onToggleWishlist}
          isInCart={isInCart(product.id)}
          isInWishlist={isInWishlist(product.id)}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
