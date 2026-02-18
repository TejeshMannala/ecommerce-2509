import React, { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { ShoppingBag } from 'lucide-react';
import Button from '../../components/common/Button';
import CartItem from './CartItem';
import CartSummary from './CartSummary';
import { fetchCart, removeCartItemAsync, updateCartItemAsync } from '../../redux/slices/cartSlice';

const Cart = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { items: cartStateItems, loading } = useSelector((state) => state.cart);

  useEffect(() => {
    dispatch(fetchCart());
  }, [dispatch]);

  const cartItems = cartStateItems.map((item) => ({
    ...item,
    id: item.productId,
    maxQuantity: item.maxQuantity || 99,
    inStock: item.inStock !== false,
    image: item.image || '/api/placeholder/100/100',
  })).filter((item) => item?.productId && item?.name && Number(item.quantity) > 0);

  const totals = useMemo(() => {
    const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  }, [cartItems]);

  const itemCount = useMemo(
    () => cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0),
    [cartItems]
  );

  const handleUpdateQuantity = async (productId, newQuantity) => {
    if (newQuantity < 1) {
      return;
    }
    await dispatch(updateCartItemAsync({ productId, quantity: newQuantity }));
  };

  const handleRemoveItem = async (productId) => {
    await dispatch(removeCartItemAsync(productId));
  };

  const handleCheckout = () => {
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  if (cartItems.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-sm sm:p-8">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gray-100 sm:h-24 sm:w-24">
            <ShoppingBag className="h-12 w-12 text-gray-400" />
          </div>
          <h2 className="mb-2 text-xl font-bold text-gray-900 sm:text-2xl">No products in your cart</h2>
          <p className="mb-8 text-sm text-gray-600 sm:text-base">
            Add items from the products page to continue.
          </p>
          <Button variant="ghost" size="lg" onClick={handleContinueShopping}>
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between gap-2 mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Shopping Cart</h1>
          <p className="text-sm sm:text-base text-gray-600">{itemCount} items</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <CartItem
                key={item.productId}
                item={item}
                onUpdateQuantity={handleUpdateQuantity}
                onRemoveItem={handleRemoveItem}
                isLoading={loading}
              />
            ))}
          </div>

          <div className="lg:col-span-1">
            <CartSummary
              items={cartItems}
              subtotal={totals.subtotal}
              tax={totals.tax}
              shipping={totals.shipping}
              total={totals.total}
              onCheckout={handleCheckout}
              isLoading={loading}
            />
          </div>
        </div>

      </div>
    </div>
  );
};

export default Cart;
