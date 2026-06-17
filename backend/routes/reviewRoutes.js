const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createReview,
  getProductReviews,
  getUserReviewForProduct,
  checkCanReview,
  updateReview,
  deleteReview,
  getUserReviews,
} = require('../controller/reviewController');

const router = express.Router();

router.get('/mine', protect, getUserReviews);

router.get('/:productId', getProductReviews);
router.get('/:productId/user-review', protect, getUserReviewForProduct);
router.get('/:productId/can-review', protect, checkCanReview);
router.post('/:productId', protect, createReview);

router.put('/:id', protect, updateReview);
router.delete('/:id', protect, deleteReview);

module.exports = router;
