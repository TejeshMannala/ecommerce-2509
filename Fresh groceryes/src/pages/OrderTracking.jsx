import React, { useEffect, useMemo } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { CheckCircle2, Circle, Home, PackageCheck, Truck } from 'lucide-react';
import Button from '../components/common/Button';
import { fetchOrderById } from '../redux/slices/orderSlice';

const getTrackingIndex = (status) => {
  const normalizedStatus = String(status || '').toLowerCase();
  const statusIndexMap = {
    pending: 0,
    confirmed: 0,
    processing: 1,
    shipped: 2,
    out_for_delivery: 2,
    delivered: 3,
  };

  if (normalizedStatus === 'cancelled' || normalizedStatus === 'failed') {
    return -1;
  }

  return statusIndexMap[normalizedStatus] ?? 0;
};

const OrderTracking = () => {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { orders, loading } = useSelector((state) => state.orders);
  const order = orders.find((item) => item.id === id);

  useEffect(() => {
    if (!order && id) {
      dispatch(fetchOrderById(id));
    }
  }, [dispatch, id, order]);

  const readableOrderId = order?.orderId || order?.id || id;
  const totalQuantity = useMemo(
    () => (order?.items || []).reduce((sum, item) => sum + (Number(item.quantity) || 0), 0),
    [order?.items]
  );
  const trackingIndex = getTrackingIndex(order?.status);
  const showSuccessTick = Boolean(location.state?.fromSuccess);

  const toDate = (value) => {
    if (!value) return null;
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  };

  const formatDate = (value) => {
    const date = toDate(value);
    if (!date) return 'Not available';
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(price || 0));

  const expectedDeliveryDate = useMemo(() => {
    if (order?.estimatedDelivery) {
      return order.estimatedDelivery;
    }
    if (!order?.createdAt) {
      return null;
    }
    const created = new Date(order.createdAt);
    created.setDate(created.getDate() + 5);
    return created.toISOString();
  }, [order?.createdAt, order?.estimatedDelivery]);

  const timelineSteps = useMemo(
    () => [
      { key: 'placed', label: 'Placed', icon: PackageCheck, date: order?.createdAt },
      { key: 'processing', label: 'Processing', icon: Circle, date: trackingIndex >= 1 ? order?.updatedAt || order?.createdAt : null },
      { key: 'shipped', label: 'Shipped', icon: Truck, date: trackingIndex >= 2 ? order?.updatedAt || order?.createdAt : null },
      { key: 'delivered', label: 'Delivered', icon: Home, date: trackingIndex >= 3 ? order?.estimatedDelivery || order?.updatedAt : expectedDeliveryDate },
    ],
    [expectedDeliveryDate, order?.createdAt, order?.estimatedDelivery, order?.updatedAt, trackingIndex]
  );

  if (loading && !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center max-w-md">
          <p className="text-gray-700 font-medium">Loading tracking details...</p>
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
            Back to My Orders
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/my-orders')}
            className="mb-3 w-auto text-xs sm:text-sm"
          >
            {'<- Back to Orders'}
          </Button>
          <div className="min-w-0">
            <h1 className="break-all text-2xl font-bold text-gray-900 sm:text-3xl">Track Order</h1>
            <p className="text-sm text-gray-600 sm:text-base">Order ID: {readableOrderId}</p>
          </div>
        </div>

        {showSuccessTick && (
          <div className="mb-6 rounded-lg border border-green-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-7 w-7 text-green-600 order-confirm-check" />
              <p className="text-sm font-semibold text-green-700 sm:text-base">
                Payment confirmed. Tracking started for your order.
              </p>
            </div>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6 mb-6">
          <div className="grid grid-cols-1 gap-2 text-sm text-gray-700 sm:grid-cols-3">
            <p className="break-all">
              <span className="font-semibold text-gray-900">Order ID:</span> {readableOrderId}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Quantity:</span> {totalQuantity}
            </p>
            <p>
              <span className="font-semibold text-gray-900">Price:</span> {formatPrice(order.total)}
            </p>
          </div>
          <p className="mt-3 text-sm text-gray-700">
            <span className="font-semibold text-gray-900">Expected Delivery:</span> {formatDate(expectedDeliveryDate)}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg p-4 sm:p-6">
          {(order.status === 'cancelled' || order.status === 'failed') ? (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 capitalize">
              Order {order.status}. Tracking timeline is unavailable.
            </div>
          ) : (
            <div className="relative pl-7 sm:pl-8">
              <div className="absolute left-3 top-2 bottom-2 w-px bg-gray-200 sm:left-4" />
              {timelineSteps.map((step, index) => {
                const isCompleted = index <= trackingIndex;
                const Icon = step.icon;
                return (
                  <div
                    key={step}
                    className="relative mb-4 last:mb-0"
                  >
                    <div
                      className={`absolute -left-7 top-1 flex h-5 w-5 items-center justify-center rounded-full border bg-white sm:-left-8 ${
                        isCompleted ? 'border-green-500 text-green-600' : 'border-gray-300 text-gray-400'
                      }`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                    </div>
                    <div
                      className={`rounded-md border px-3 py-2 ${
                        isCompleted
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <p className={`text-sm font-semibold ${isCompleted ? 'text-green-700' : 'text-gray-600'}`}>
                        {step.label}
                      </p>
                      <p className="text-xs text-gray-500">Date: {formatDate(step.date)}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderTracking;
