const Order = require('../models/Order');
const Cart = require('../models/Cart');

const VALID_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
  'failed',
];

const INITIAL_ORDER_STATUSES = ['pending', 'confirmed', 'processing', 'failed'];

const STATUS_TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'failed'],
  confirmed: ['processing', 'cancelled'],
  processing: ['shipped', 'cancelled'],
  shipped: ['out_for_delivery', 'delivered', 'cancelled'],
  out_for_delivery: ['delivered'],
  delivered: ['refunded'],
};

const generateOrderId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 7);
  return `ORD-${timestamp}-${random}`.toUpperCase();
};

const sanitizeOrderItems = (items) =>
  items.map((item) => ({
    productId: String(item?.productId || ''),
    name: String(item?.name || ''),
    price: Number(item?.price),
    quantity: Math.max(1, parseInt(item?.quantity, 10) || 1),
    image: String(item?.image || ''),
    sku: item?.sku ? String(item.sku) : undefined,
  }));

const createOrder = async (req, res) => {
  try {
    if (!req.user?._id) {
      return res.status(401).json({ message: 'Not authorized' });
    }

    const {
      items,
      shippingAddress,
      shippingInfo,
      billingAddress,
      payment,
      paymentMethod,
      tax = 0,
      shipping = 0,
      discount = 0,
      shippingMethod = 'standard',
      notes,
      currency = 'USD',
      status = 'pending',
    } = req.body;

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Order items are required' });
    }

    const resolvedShippingAddress = shippingAddress || shippingInfo;
    if (!resolvedShippingAddress) {
      return res.status(400).json({ message: 'Shipping address is required' });
    }

    const incomingPayment = payment || (paymentMethod ? { method: paymentMethod } : null);
    if (!incomingPayment || !incomingPayment.method) {
      return res.status(400).json({ message: 'Payment method is required' });
    }

    const normalizedInitialStatus = String(status || 'pending').toLowerCase();
    if (!INITIAL_ORDER_STATUSES.includes(normalizedInitialStatus)) {
      return res.status(400).json({ message: 'Invalid initial order status' });
    }

    const normalizedItems = sanitizeOrderItems(items);
    const hasInvalidItem = normalizedItems.some(
      (item) => !item.productId || !item.name || !item.image || !Number.isFinite(item.price) || item.price < 0
    );

    if (hasInvalidItem) {
      return res.status(400).json({ message: 'Each item must include valid productId, name, image, and non-negative price' });
    }

    const subtotal = normalizedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const parsedTax = Number(tax) || 0;
    const parsedShipping = Number(shipping) || 0;
    const parsedDiscount = Number(discount) || 0;
    const total = subtotal + parsedTax + parsedShipping - parsedDiscount;

    const paymentData = {
      ...incomingPayment,
      method: String(incomingPayment.method),
      amount: Number(incomingPayment.amount ?? total),
      currency: String(incomingPayment.currency || currency).toUpperCase(),
      status: incomingPayment.status || 'pending',
    };

    const order = await Order.create({
      orderId: generateOrderId(),
      user: req.user._id,
      items: normalizedItems,
      subtotal,
      tax: parsedTax,
      shipping: parsedShipping,
      discount: parsedDiscount,
      total,
      currency: String(currency).toUpperCase(),
      status: normalizedInitialStatus,
      payment: paymentData,
      shippingAddress: resolvedShippingAddress,
      billingAddress: billingAddress || resolvedShippingAddress,
      shippingMethod,
      notes,
      metadata: {
        userAgent: req.get('user-agent') || '',
        ipAddress: req.ip,
        sessionId: req.headers['x-session-id'] || '',
      },
    });

    try {
      await Cart.findOneAndUpdate(
        { user: req.user._id },
        {
          $set: {
            items: [],
            subtotal: 0,
            tax: 0,
            shipping: 0,
            discount: 0,
            total: 0,
            itemCount: 0,
            lastUpdated: new Date(),
          },
        }
      );
    } catch (cartError) {
      // Keep order success path intact even if cart cleanup fails.
      console.error('Cart clear after order failed:', cartError);
    }

    return res.status(201).json({
      message: 'Order created successfully',
      order,
    });
  } catch (error) {
    console.error('Create order error:', error);

    if (error?.name === 'ValidationError') {
      const firstValidationMessage = Object.values(error.errors || {})
        .map((validationError) => validationError?.message)
        .find(Boolean);

      return res.status(400).json({
        message: firstValidationMessage || 'Invalid order data',
      });
    }

    if (error?.name === 'CastError') {
      return res.status(400).json({
        message: 'Invalid order payload',
      });
    }

    if (error?.code === 11000) {
      return res.status(409).json({
        message: 'Duplicate order detected. Please try again.',
      });
    }

    return res.status(500).json({
      message: 'Failed to create order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id, isDeleted: false }).sort({ createdAt: -1 });
    return res.status(200).json({ orders });
  } catch (error) {
    console.error('Get orders error:', error);
    return res.status(500).json({
      message: 'Failed to get orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getOrderById = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id, isDeleted: false });

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error('Get order by ID error:', error);
    return res.status(500).json({
      message: 'Failed to get order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: 'Status is required' });
    }

    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findOne({ _id: req.params.id, user: req.user._id, isDeleted: false });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === status) {
      return res.status(200).json({
        message: 'Order status already updated',
        order,
      });
    }

    const allowedTransitions = STATUS_TRANSITIONS[order.status] || [];
    if (allowedTransitions.length > 0 && !allowedTransitions.includes(status)) {
      return res.status(400).json({ message: `Cannot transition from ${order.status} to ${status}` });
    }

    order.status = status;

    if (status === 'delivered' && !order.estimatedDelivery) {
      order.estimatedDelivery = new Date();
    }

    await order.save();

    return res.status(200).json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Update order status error:', error);
    return res.status(500).json({
      message: 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id, isDeleted: false });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      return res.status(200).json({
        message: 'Order is already cancelled',
        order,
      });
    }

    const allowedTransitions = STATUS_TRANSITIONS[order.status] || [];
    if (allowedTransitions.length > 0 && !allowedTransitions.includes('cancelled')) {
      return res.status(400).json({ message: `Cannot cancel order with status ${order.status}` });
    }

    order.status = 'cancelled';
    order.cancellation = {
      reason: 'customer_request',
      cancelledAt: new Date(),
      cancelledBy: req.user._id,
    };
    await order.save();

    return res.status(200).json({
      message: 'Order cancelled successfully',
      order,
    });
  } catch (error) {
    console.error('Cancel order error:', error);
    return res.status(500).json({
      message: 'Failed to cancel order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getOrderStatus = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id, isDeleted: false });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({
      status: order.status,
      order,
    });
  } catch (error) {
    console.error('Get order status error:', error);
    return res.status(500).json({
      message: 'Failed to get order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getOrderTracking = async (req, res) => {
  try {
    const order = await Order.findOne({ _id: req.params.id, user: req.user._id, isDeleted: false });
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({
      tracking: order.tracking || { status: 'pending' },
      status: order.status,
      order,
    });
  } catch (error) {
    console.error('Get order tracking error:', error);
    return res.status(500).json({
      message: 'Failed to get order tracking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const order = await Order.findOneAndUpdate(
      { _id: req.params.id, user: req.user._id, isDeleted: false },
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Delete order error:', error);
    return res.status(500).json({
      message: 'Failed to delete order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStatus,
  getOrderTracking,
  deleteOrder,
};
