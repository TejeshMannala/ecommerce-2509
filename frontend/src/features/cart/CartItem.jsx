import React from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import Button from '../../components/common/Button';
import { applyImageFallback, resolveImageUrl } from '../../utils/image';

const CartItem = ({ 
  item, 
  onUpdateQuantity, 
  onRemoveItem, 
  isLoading = false 
}) => {
  const { id, name, price, image, quantity, maxQuantity, inStock } = item;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const subtotal = price * quantity;
  const productImageUrl = resolveImageUrl(image, {
    width: 100,
    height: 100,
    text: name || 'Item',
  });

  return (
    <div className="flex items-start gap-3 sm:gap-4 py-4 border-b border-gray-200 max-[350px]:flex-col">
      {/* Product Image */}
      <div className="flex-shrink-0">
        <img 
          src={productImageUrl} 
          alt={name}
          onError={(event) =>
            applyImageFallback(event, {
              width: 100,
              height: 100,
              text: name || 'Item',
            })
          }
          className="w-20 h-20 object-cover rounded-lg max-[350px]:w-full max-[350px]:h-32"
        />
      </div>

      {/* Product Info */}
      <div className="flex-1 w-full">
        <h3 className="font-semibold text-gray-900 text-sm sm:text-base">{name}</h3>
        <p className="text-xs sm:text-sm text-gray-600">Unit price: {formatPrice(price)}</p>
        
        {/* Quantity Controls */}
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-xs sm:text-sm text-gray-600">Quantity:</span>
          <div className="flex items-center border border-gray-300 rounded-lg">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateQuantity(id, Math.max(1, quantity - 1))}
              disabled={isLoading || quantity <= 1}
              className="px-2 py-1"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <span className="px-3 py-1 text-sm font-medium">{quantity}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateQuantity(id, Math.min(maxQuantity || 99, quantity + 1))}
              disabled={isLoading || quantity >= (maxQuantity || 99) || !inStock}
              className="px-2 py-1"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {!inStock && (
            <span className="text-red-600 text-xs sm:text-sm">Out of stock</span>
          )}
        </div>
      </div>

      {/* Actions and Price */}
      <div className="flex flex-col items-end space-y-2 max-[350px]:w-full max-[350px]:flex-row max-[350px]:items-center max-[350px]:justify-between max-[350px]:space-y-0">
        <div className="text-right max-[350px]:text-left">
          <p className="text-base sm:text-lg font-bold text-gray-900">{formatPrice(subtotal)}</p>
          <p className="text-xs text-gray-500">Subtotal</p>
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onRemoveItem(id)}
          disabled={isLoading}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 max-[350px]:px-2"
        >
          <Trash2 className="h-4 w-4 mr-1" />
          Remove
        </Button>
      </div>
    </div>
  );
};

export default CartItem;
