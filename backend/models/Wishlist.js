const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    image: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      trim: true,
    },
    addedAt: {
      type: Date,
      default: Date.now,
    },
    notes: {
      type: String,
      maxlength: [200, 'Notes cannot exceed 200 characters'],
    },
  },
  { _id: true }
);

const wishlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [wishlistItemSchema],
    itemCount: {
      type: Number,
      default: 0,
    },
    lastUpdated: {
      type: Date,
      default: Date.now,
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      sessionId: String,
    },
  },
  {
    timestamps: true,
  }
);

wishlistSchema.index({ 'items.addedAt': -1 });

const Wishlist = mongoose.model('Wishlist', wishlistSchema);

module.exports = Wishlist;
