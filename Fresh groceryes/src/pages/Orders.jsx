import React, { useMemo, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Eye } from 'lucide-react';
import Button from '../components/common/Button';
import OrderItem from '../components/order/OrderItem';
import { cancelOrderAsync, fetchOrders } from '../redux/slices/orderSlice';

const Orders = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [statusFilter, setStatusFilter] = useState('all');
  const { orders, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const sortedOrders = useMemo(
    () =>
      [...orders].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [orders]
  );

  const filteredOrders = sortedOrders.filter((order) => {
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesStatus;
  });

  const handleViewDetails = (orderId) => {
    navigate(`/my-orders/${orderId}`);
  };

  const handleCancelOrder = async (orderId) => {
    await dispatch(cancelOrderAsync(orderId));
  };

  const handleTrackOrder = (orderId) => {
    navigate(`/my-orders/${orderId}/track`);
  };

  if (loading && sortedOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg p-8 text-center shadow-sm border border-gray-200">
          <p className="text-gray-700 font-medium">Loading orders...</p>
        </div>
      </div>
    );
  }

  if (sortedOrders.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200 max-w-md">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Eye className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-6">Place your first order from the cart.</p>
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
            <h1 className="text-3xl font-bold text-gray-900">My Orders</h1>
            <p className="text-gray-600">Track and manage your orders</p>
          </div>
          <Button variant="primary" onClick={() => navigate('/products')}>
            Continue Shopping
          </Button>
        </div>


        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-8">
          <div className="flex flex-col lg:flex-row gap-4">
            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="input-field"
            >
              <option value="all">All Status</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        <div className="space-y-6">
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-lg p-12 text-center shadow-sm border border-gray-200">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Eye className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-600 mb-6">Try adjusting your search criteria or filters.</p>
              <Button
                variant="primary"
                onClick={() => {
                  setStatusFilter('all');
                }}
              >
                Clear Filters
              </Button>
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderItem
                key={order.id}
                order={order}
                onViewDetails={handleViewDetails}
                onCancelOrder={handleCancelOrder}
                onTrackOrder={handleTrackOrder}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;
