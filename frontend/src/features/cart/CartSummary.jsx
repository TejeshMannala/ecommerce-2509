import React from 'react';
import Button from '../../components/common/Button';

const CartSummary = ({
  items = [],
  subtotal,
  tax,
  shipping,
  total,
  onCheckout,
  isLoading = false,
  className = '',
}) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);
  };

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className={`card p-4 sm:p-6 ${className}`}>
      <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">Order Summary</h2>

      <div className="space-y-3 mb-4">
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-600">Subtotal ({itemCount} items)</span>
          <span className="font-medium">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-600">Shipping</span>
          <span className="font-medium">{shipping === 0 ? 'Free' : formatPrice(shipping)}</span>
        </div>
        <div className="flex justify-between text-xs sm:text-sm">
          <span className="text-gray-600">Tax</span>
          <span className="font-medium">{formatPrice(tax)}</span>
        </div>
        <div className="border-t border-gray-200 pt-3">
          <div className="flex justify-between text-base sm:text-lg font-bold">
            <span>Total</span>
            <span>{formatPrice(total)}</span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <Button
          variant="primary"
          size="lg"
          onClick={onCheckout}
          disabled={isLoading || items.length === 0}
          fullWidth
        >
          {isLoading ? 'Processing...' : `Checkout - ${formatPrice(total)}`}
        </Button>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => window.history.back()}
          fullWidth
        >
          Continue Shopping
        </Button>
      </div>

      <div className="mt-4 text-xs text-gray-500 space-y-1">
        <p>* All prices include applicable taxes</p>
        <p>* Shipping calculated at checkout</p>
        <p>* Free shipping on orders over Rs 50</p>
      </div>
    </div>
  );
};

export default CartSummary;
