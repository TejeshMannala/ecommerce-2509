const mongoose = require('mongoose');
const Order = require('../../models/Order');

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

const listOrdersForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      paymentStatus,
      userId,
      orderId,
      search,
      includeDeleted = 'false',
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const sortDirection = String(order).toLowerCase() === 'asc' ? 1 : -1;

    const query = {};
    if (String(includeDeleted).toLowerCase() !== 'true') {
      query.isDeleted = false;
    }
    if (status) query.status = status;
    if (paymentStatus) query['payment.status'] = paymentStatus;
    if (orderId) query.orderId = String(orderId).toUpperCase().trim();

    if (userId && mongoose.Types.ObjectId.isValid(userId)) {
      query.user = userId;
    }

    if (search) {
      query.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { 'shippingAddress.fullName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.email': { $regex: search, $options: 'i' } },
      ];
    }

    const [orders, total] = await Promise.all([
      Order.find(query)
        .populate('user', 'name email')
        .sort({ [sortBy]: sortDirection })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      Order.countDocuments(query),
    ]);

    return res.status(200).json({
      orders,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Admin list orders error:', error);
    return res.status(500).json({
      message: 'Failed to fetch orders',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getOrderByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(id).populate('user', 'name email');
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ order });
  } catch (error) {
    console.error('Admin get order by id error:', error);
    return res.status(500).json({
      message: 'Failed to fetch order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const updateOrderStatusAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, notes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    if (!status || !VALID_STATUSES.includes(status)) {
      return res.status(400).json({ message: 'Invalid order status' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.status = status;
    if (notes !== undefined) order.notes = notes;

    if (status === 'cancelled') {
      order.cancellation = {
        reason: 'other',
        notes: notes ? String(notes) : 'Cancelled by admin',
        cancelledAt: new Date(),
      };
    }

    if (status === 'delivered') {
      order.tracking = {
        ...(order.tracking || {}),
        status: 'delivered',
        lastUpdated: new Date(),
      };
    }

    await order.save();

    return res.status(200).json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.error('Admin update order status error:', error);
    return res.status(500).json({
      message: 'Failed to update order status',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const updateOrderTrackingAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { carrier, trackingNumber, trackingUrl, trackingStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    order.tracking = {
      ...(order.tracking || {}),
      carrier: carrier || order.tracking?.carrier,
      trackingNumber: trackingNumber || order.tracking?.trackingNumber,
      trackingUrl: trackingUrl || order.tracking?.trackingUrl,
      status: trackingStatus || order.tracking?.status || 'pending',
      lastUpdated: new Date(),
    };

    await order.save();

    return res.status(200).json({
      message: 'Order tracking updated successfully',
      order,
    });
  } catch (error) {
    console.error('Admin update order tracking error:', error);
    return res.status(500).json({
      message: 'Failed to update order tracking',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const deleteOrderAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid order id' });
    }

    const order = await Order.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    return res.status(200).json({ message: 'Order deleted successfully' });
  } catch (error) {
    console.error('Admin delete order error:', error);
    return res.status(500).json({
      message: 'Failed to delete order',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  listOrdersForAdmin,
  getOrderByIdForAdmin,
  updateOrderStatusAsAdmin,
  updateOrderTrackingAsAdmin,
  deleteOrderAsAdmin,
};
