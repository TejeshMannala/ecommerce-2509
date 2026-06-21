const mongoose = require('mongoose');
const Review = require('../models/Review');
const Product = require('../models/Product');
const Order = require('../models/Order');

const recalculateProductRating = async (productId) => {
  try {
    const result = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(String(productId)), status: 'approved' } },
      {
        $group: {
          _id: '$product',
          average: { $avg: '$rating' },
          count: { $sum: 1 },
        },
      },
    ]);

    const ratings = result[0] || { average: 0, count: 0 };
    await Product.findByIdAndUpdate(productId, {
      'ratings.average': Math.round(ratings.average * 10) / 10,
      'ratings.count': ratings.count,
    });
  } catch (error) {
    console.error('Recalculate rating error:', error);
  }
};

const hasUserPurchasedProduct = async (userId, productId) => {
  try {
    const order = await Order.findOne({
      user: userId,
      status: 'delivered',
      'items.productId': String(productId),
    });
    return !!order;
  } catch (error) {
    console.error('Check purchase error:', error);
    return false;
  }
};

const createReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const { rating, title, comment } = req.body;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    if (!comment || !comment.trim()) {
      return res.status(400).json({ message: 'Review comment is required' });
    }

    const existingReview = await Review.findOne({ product: productId, user: req.user._id });
    if (existingReview) {
      return res.status(409).json({ message: 'You have already reviewed this product' });
    }

    const isVerifiedPurchase = await hasUserPurchasedProduct(req.user._id, productId);

    let orderId = undefined;
    if (isVerifiedPurchase) {
      const order = await Order.findOne({ user: req.user._id, status: 'delivered', 'items.productId': String(productId) }).select('_id');
      if (order) orderId = order._id;
    }

    const review = await Review.create({
      product: productId,
      user: req.user._id,
      order: orderId,
      rating,
      title: title || '',
      comment: comment.trim(),
      isVerifiedPurchase,
    });

    await recalculateProductRating(productId);

    const populatedReview = await Review.findById(review._id).populate('user', 'name');

    return res.status(201).json({
      message: 'Review created successfully',
      review: populatedReview,
    });
  } catch (error) {
    console.error('Create review error:', error);

    if (error.code === 11000) {
      return res.status(409).json({ message: 'You have already reviewed this product' });
    }

    return res.status(500).json({ message: 'Failed to create review' });
  }
};

const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const filter = { product: productId, status: 'approved' };

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('user', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    const ratingBreakdown = await Review.aggregate([
      { $match: { product: new mongoose.Types.ObjectId(String(productId)), status: 'approved' } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
      { $sort: { _id: -1 } },
    ]);

    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    ratingBreakdown.forEach((item) => { breakdown[item._id] = item.count; });

    return res.json({
      reviews,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
      ratingBreakdown: breakdown,
    });
  } catch (error) {
    console.error('Get reviews error:', error);
    return res.status(500).json({ message: 'Failed to fetch reviews' });
  }
};

const getUserReviewForProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const review = await Review.findOne({ product: productId, user: req.user._id }).lean();
    return res.json({ review: review || null });
  } catch (error) {
    console.error('Get user review error:', error);
    return res.status(500).json({ message: 'Failed to fetch your review' });
  }
};

const checkCanReview = async (req, res) => {
  try {
    const { productId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: 'Invalid product ID' });
    }

    const existingReview = await Review.findOne({ product: productId, user: req.user._id });
    if (existingReview) {
      return res.json({ canReview: false, reason: 'already_reviewed' });
    }

    const hasPurchased = await hasUserPurchasedProduct(req.user._id, productId);
    return res.json({ canReview: hasPurchased, reason: hasPurchased ? null : 'not_purchased' });
  } catch (error) {
    console.error('Check can review error:', error);
    return res.status(500).json({ message: 'Failed to check review eligibility' });
  }
};

const updateReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (String(review.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only edit your own reviews' });
    }

    if (rating !== undefined) {
      if (rating < 1 || rating > 5) {
        return res.status(400).json({ message: 'Rating must be between 1 and 5' });
      }
      review.rating = rating;
    }

    if (title !== undefined) review.title = title;
    if (comment !== undefined) {
      if (!comment.trim()) {
        return res.status(400).json({ message: 'Review comment is required' });
      }
      review.comment = comment.trim();
    }

    await review.save();

    await recalculateProductRating(review.product);

    const populatedReview = await Review.findById(review._id).populate('user', 'name');

    return res.json({ message: 'Review updated successfully', review: populatedReview });
  } catch (error) {
    console.error('Update review error:', error);
    return res.status(500).json({ message: 'Failed to update review' });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    if (String(review.user) !== String(req.user._id)) {
      return res.status(403).json({ message: 'You can only delete your own reviews' });
    }

    const productId = review.product;
    await Review.findByIdAndDelete(id);

    await recalculateProductRating(productId);

    return res.json({ message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Delete review error:', error);
    return res.status(500).json({ message: 'Failed to delete review' });
  }
};

const getUserReviews = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
    const skip = (page - 1) * limit;

    const [reviews, total] = await Promise.all([
      Review.find({ user: req.user._id })
        .populate('product', 'name images category')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments({ user: req.user._id }),
    ]);

    return res.json({
      reviews,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Get user reviews error:', error);
    return res.status(500).json({ message: 'Failed to fetch your reviews' });
  }
};

module.exports = {
  createReview,
  getProductReviews,
  getUserReviewForProduct,
  checkCanReview,
  updateReview,
  deleteReview,
  getUserReviews,
};
