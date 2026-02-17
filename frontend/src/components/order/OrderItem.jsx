import React from 'react';
import { Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import Button from '../common/Button';
import { applyImageFallback, resolveImageUrl } from '../../utils/image';

const OrderItem = ({ order, onViewDetails, onCancelOrder, onTrackOrder }) => {
  const readableOrderId = order.orderId || order.id;

  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(price);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 bg-green-100';
      case 'shipped':
        return 'text-blue-600 bg-blue-100';
      case 'processing':
        return 'text-yellow-600 bg-yellow-100';
      case 'cancelled':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle className="h-4 w-4" />;
      case 'shipped':
        return <Truck className="h-4 w-4" />;
      case 'processing':
        return <Package className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Package className="h-4 w-4" />;
    }
  };

  return (
    <div className="card p-3 sm:p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="mb-2 flex flex-wrap items-center gap-2 sm:gap-3">
            <h3 className="min-w-0 break-all text-base font-semibold text-gray-900 sm:text-lg">
              Order #{readableOrderId}
            </h3>
            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium sm:px-2.5 sm:text-xs ${getStatusColor(order.status)}`}>
              {getStatusIcon(order.status)}
              <span className="ml-1 capitalize">{order.status}</span>
            </span>
          </div>
          <p className="text-xs text-gray-600 sm:text-sm">
            Placed on {formatDate(order.createdAt)}
          </p>
          {order.estimatedDelivery && (
            <p className="text-xs text-gray-600 sm:text-sm">
              Estimated delivery: {formatDate(order.estimatedDelivery)}
            </p>
          )}
        </div>
        <div className="text-left sm:text-right">
          <p className="text-base font-bold text-gray-900 sm:text-lg">
            {formatPrice(order.total)}
          </p>
          <p className="text-xs text-gray-500 sm:text-sm">Total</p>
        </div>
      </div>

      {/* Order Items */}
      <div className="mb-4 border-t border-gray-200 pt-4">
        <h4 className="mb-2 text-sm font-medium text-gray-900">Items ({order.items.length})</h4>
        <div className="space-y-2">
          {order.items.slice(0, 3).map((item) => (
            <div key={item.id} className="flex items-center gap-2 sm:gap-3">
              <img
                src={resolveImageUrl(item.image, {
                  width: 60,
                  height: 60,
                  text: item.name || 'Item',
                })}
                alt={item.name}
                onError={(event) =>
                  applyImageFallback(event, {
                    width: 60,
                    height: 60,
                    text: item.name || 'Item',
                  })
                }
                className="h-10 w-10 rounded object-cover sm:h-12 sm:w-12"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-medium text-gray-900 sm:text-sm">{item.name}</p>
                <p className="text-[11px] text-gray-500 sm:text-xs">Qty: {item.quantity} x {formatPrice(item.price)}</p>
              </div>
              <p className="text-xs font-medium text-gray-900 sm:text-sm">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
          {order.items.length > 3 && (
            <p className="text-xs text-gray-600 sm:text-sm">
              +{order.items.length - 3} more items
            </p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-2 sm:gap-3">
        <Button
          variant="primary"
          size="sm"
          onClick={() => onViewDetails(order.id)}
          className="px-2.5 py-1 text-xs sm:text-sm"
        >
          View Order
        </Button>
        {order.status === 'processing' && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onCancelOrder(order.id)}
            className="px-2.5 py-1 text-xs text-red-600 hover:bg-red-50 hover:text-red-700 sm:text-sm"
          >
            Cancel Order
          </Button>
        )}
        {order.status === 'delivered' && (
          <Button
            variant="secondary"
            size="sm"
            className="px-2.5 py-1 text-xs sm:text-sm"
          >
            Reorder
          </Button>
        )}
        <Button
          variant="secondary"
          size="sm"
          onClick={() => onTrackOrder(order.id)}
          className="px-2.5 py-1 text-xs"
        >
          Track Order
        </Button>
      </div>
    </div>
  );
};

export default OrderItem;
