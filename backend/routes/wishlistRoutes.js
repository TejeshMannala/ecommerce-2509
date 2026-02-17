const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  clearWishlist,
} = require('../controller/wishlistController');

const router = express.Router();

router.use(protect);

router.get('/', getWishlist);
router.post('/items', addToWishlist);
router.delete('/items/:productId', removeFromWishlist);
router.delete('/', clearWishlist);

module.exports = router;