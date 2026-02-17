const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  getCartTotal,
} = require('../controller/cartController');

const router = express.Router();

router.use(protect);

router.get('/', getCart);
router.get('/total', getCartTotal);
router.post('/items', addToCart);
router.put('/items/:productId', updateCartItem);
router.delete('/items/:productId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;