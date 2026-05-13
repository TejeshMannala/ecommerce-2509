import React, { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import Button from '../components/common/Button';
import { resolveImageUrl } from '../utils/image';
import { fetchOrderById } from '../redux/slices/orderSlice';

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);
  const order = orders.find((item) => item.id === id);
  const readableOrderId = order?.orderId || order?.id || id;

  useEffect(() => {
    if (!order && id) {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, id, order]);

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(price);

  const formatDate = (dateString) =>
    new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center max-w-md">
          <p className="text-gray-700 font-medium">Loading order details...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Order not found</h1>
          <p className="text-gray-600 mb-6">This order does not exist for the current user.</p>
          <Button variant="primary" onClick={() => navigate('/my-orders')}>
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="min-w-0">
            <h1 className="break-all text-2xl font-bold text-gray-900 sm:text-3xl">Order {readableOrderId}</h1>
            <p className="text-sm text-gray-600 sm:text-base">Placed on {formatDate(order.createdAt)}</p>
          </div>
          <Button 
            variant="primary" 
            onClick={() => navigate('/my-orders')}
            className="w-full text-sm sm:w-auto sm:text-base"
          >
            {'<- Back to Orders'}
          </Button>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-500">Status</p>
              <p className="font-semibold capitalize">{order.status}</p>
            </div>
            <div>
              <p className="text-gray-500">Estimated Delivery</p>
              <p className="font-semibold">
                {order.estimatedDelivery ? formatDate(order.estimatedDelivery) : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Total</p>
              <p className="font-semibold">{formatPrice(order.total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Items</h2>
          <div className="space-y-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-2 border-b border-gray-200 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={resolveImageUrl(item.image, {
                      width: 80,
                      height: 80,
                      text: item.name || 'Item',
                    })}
                    alt={item.name}
                    className="h-12 w-12 rounded object-cover sm:h-14 sm:w-14"
                  />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-gray-900">{item.name}</p>
                    <p className="text-xs text-gray-600 sm:text-sm">Qty: {item.quantity}</p>
                  </div>
                </div>
                <p className="text-sm font-semibold text-gray-900 sm:text-base">{formatPrice(item.price * item.quantity)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;

