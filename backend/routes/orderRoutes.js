const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const {
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  cancelOrder,
  getOrderStatus,
  getOrderTracking,
  deleteOrder,
} = require('../controller/orderController');

router.route('/')
  .post(protect, createOrder)
  .get(protect, getOrders);

router.route('/:id')
  .get(protect, getOrderById)
  .put(protect, updateOrderStatus)
  .delete(protect, deleteOrder);

router.post('/:id/cancel', protect, cancelOrder);
router.get('/:id/status', protect, getOrderStatus);
router.get('/:id/tracking', protect, getOrderTracking);

module.exports = router;
