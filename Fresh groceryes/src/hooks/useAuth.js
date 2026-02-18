import { useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { authAPI } from '../api/authAPI';
import { loginFailure, loginStart, loginSuccess, logout, clearError } from '../redux/slices/authSlice';
import { clearCart, fetchCart } from '../redux/slices/cartSlice';
import { clearWishlist, fetchWishlist } from '../redux/slices/wishlistSlice';
import { clearOrders, fetchOrders } from '../redux/slices/orderSlice';

export const useAuth = () => {
  const dispatch = useDispatch();
  const { user, token, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);

  const hydrateUserData = useCallback(async () => {
    await Promise.allSettled([
      dispatch(fetchCart()).unwrap(),
      dispatch(fetchWishlist()).unwrap(),
      dispatch(fetchOrders()).unwrap(),
    ]);
  }, [dispatch]);

  const login = useCallback(
    async (email, password) => {
      try {
        dispatch(loginStart());
        const response = await authAPI.login(email, password);

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));
        console.log('Token stored:', response.token);

        dispatch(loginSuccess({ user: response.user, token: response.token }));
        await hydrateUserData();

        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Login failed';
        dispatch(loginFailure(errorMessage));
        return {
          success: false,
          error: errorMessage,
          lockedUntil: error.response?.data?.lockedUntil || null,
          statusCode: error.response?.status,
        };
      }
    },
    [dispatch, hydrateUserData]
  );

  const register = useCallback(
    async (userData) => {
      try {
        dispatch(loginStart());
        const response = await authAPI.register(userData);

        localStorage.setItem('token', response.token);
        localStorage.setItem('user', JSON.stringify(response.user));

        dispatch(loginSuccess({ user: response.user, token: response.token }));
        await hydrateUserData();

        return { success: true, data: response };
      } catch (error) {
        const errorMessage = error.response?.data?.message || 'Registration failed';
        dispatch(loginFailure(errorMessage));
        return { success: false, error: errorMessage };
      }
    },
    [dispatch, hydrateUserData]
  );

  const logoutUser = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(clearCart());
    dispatch(clearWishlist());
    dispatch(clearOrders());
    dispatch(logout());
  }, [dispatch]);

  const clearAuthError = useCallback(() => {
    dispatch(clearError());
  }, [dispatch]);

  const getCurrentUser = useCallback(async () => {
    try {
      const response = await authAPI.getCurrentUser();
      dispatch(
        loginSuccess({
          user: response.user,
          token: localStorage.getItem('token'),
        })
      );
      await hydrateUserData();
      return response.user;
    } catch (error) {
      logoutUser();
      return null;
    }
  }, [dispatch, hydrateUserData, logoutUser]);

  return {
    user,
    token,
    isAuthenticated,
    isLoading,
    error,
    login,
    register,
    logout: logoutUser,
    clearError: clearAuthError,
    getCurrentUser,
  };
};
