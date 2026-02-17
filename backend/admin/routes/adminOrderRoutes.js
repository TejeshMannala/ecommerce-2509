const express = require('express');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const {
  listOrdersForAdmin,
  getOrderByIdForAdmin,
  updateOrderStatusAsAdmin,
  updateOrderTrackingAsAdmin,
  deleteOrderAsAdmin,
} = require('../controller/adminOrderController');

const router = express.Router();

router.use(protectAdmin);

router.get('/', listOrdersForAdmin);
router.get('/:id', getOrderByIdForAdmin);
router.patch('/:id/status', updateOrderStatusAsAdmin);
router.patch('/:id/tracking', updateOrderTrackingAsAdmin);
router.delete('/:id', deleteOrderAsAdmin);

module.exports = router;
