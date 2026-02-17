import React from 'react';
import { X, CheckCircle, ShoppingCart } from 'lucide-react';
import Button from '../common/Button';

const PaymentSuccessModal = ({
  isOpen,
  mode = 'success',
  onClose,
  onConfirm,
  isLoading = false,
  onViewOrder,
  orderDetails,
}) => {
  if (!isOpen) return null;

  const formatPrice = (price) =>
    new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(Number(price || 0));

  const isConfirmMode = mode === 'confirm';

  return (
    <div className="fixed inset-0 bg-slate-900/45 backdrop-blur-[2px] flex items-center justify-center z-50 p-4">
      <div className="order-confirm-card order-confirm-pop max-w-sm w-full">
        <button
          onClick={onClose}
          className="order-confirm-close"
          aria-label="Close"
          disabled={isLoading}
        >
          <X className="h-4 w-4" />
        </button>

        <div className="order-confirm-avatar-wrap">
          {isConfirmMode ? (
            <ShoppingCart className="h-10 w-10 text-[#07345d]" />
          ) : (
            <>
              <CheckCircle className="h-10 w-10 text-[#16e04a] order-confirm-check" />
              <span className="order-confirm-confetti order-confirm-confetti-a" />
              <span className="order-confirm-confetti order-confirm-confetti-b" />
              <span className="order-confirm-confetti order-confirm-confetti-c" />
            </>
          )}
        </div>

        {isConfirmMode ? (
          <>
            <h2 className="order-confirm-title">Would you like to confirm the order?</h2>

            {orderDetails && (
              <p className="order-confirm-subtitle">
                Total: <strong>{formatPrice(orderDetails.total)}</strong>
              </p>
            )}

            <div className="order-confirm-actions">
              <Button
                type="button"
                onClick={onConfirm}
                fullWidth
                disabled={isLoading}
                className="order-confirm-cta"
              >
                {isLoading ? 'Confirming...' : 'Confirm'}
              </Button>
              <button type="button" className="order-confirm-cancel" onClick={onClose} disabled={isLoading}>
                Cancel
              </button>
            </div>
          </>
        ) : (
          <>
            <h2 className="order-confirm-success-title">Payment Confirmed</h2>
            <p className="order-confirm-subtitle">Your order is confirmed.</p>

            {orderDetails && (
              <div className="order-confirm-meta">
                <p><strong>ID:</strong> {orderDetails.orderId}</p>
                <p><strong>Total:</strong> {formatPrice(orderDetails.total)}</p>
              </div>
            )}

            <div className="order-confirm-actions order-confirm-actions-single">
              <Button
                type="button"
                fullWidth
                className="order-confirm-cta"
                onClick={() => {
                  const targetOrderId = orderDetails?.orderInternalId || orderDetails?.orderId;
                  if (typeof onViewOrder === 'function' && targetOrderId) {
                    onViewOrder(targetOrderId);
                    return;
                  }
                  onClose();
                }}
              >
                OK
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccessModal;
