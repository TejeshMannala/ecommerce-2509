import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addCartItemAsync,
  clearCartAsync,
  fetchCart,
  removeCartItemAsync,
  updateCartItemAsync,
} from '../redux/slices/cartSlice';

export const useCart = () => {
  const dispatch = useDispatch();
  const { items, loading, error } = useSelector((state) => state.cart);
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  const loadCartFromAPI = useCallback(async () => {
    if (!isAuthenticated) {
      return [];
    }
    return dispatch(fetchCart()).unwrap();
  }, [dispatch, isAuthenticated]);

  const addItem = useCallback(
    async (productId, quantity = 1, item) =>
      dispatch(addCartItemAsync({ productId, quantity, item })).unwrap(),
    [dispatch]
  );

  const updateItem = useCallback(
    async (productId, quantity) => dispatch(updateCartItemAsync({ productId, quantity })).unwrap(),
    [dispatch]
  );

  const removeItem = useCallback(
    async (productId) => dispatch(removeCartItemAsync(productId)).unwrap(),
    [dispatch]
  );

  const clearCartItems = useCallback(async () => dispatch(clearCartAsync()).unwrap(), [dispatch]);

  const calculateTotals = useCallback(() => {
    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const tax = subtotal * 0.08;
    const shipping = subtotal > 50 ? 0 : 5.99;
    const total = subtotal + tax + shipping;
    return { subtotal, tax, shipping, total };
  }, [items]);

  const getItemCount = useCallback(
    () => items.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [items]
  );

  return {
    items,
    loading,
    error,
    addItem,
    updateItem,
    removeItem,
    clearCart: clearCartItems,
    fetchCart: loadCartFromAPI,
    loadCartFromAPI,
    calculateTotals,
    getItemCount,
  };
};
