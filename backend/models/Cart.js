const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
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
    quantity: {
      type: Number,
      required: true,
      min: 1,
      max: 99,
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
  },
  { _id: true }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    items: [cartItemSchema],
    subtotal: {
      type: Number,
      default: 0,
      min: 0,
    },
    tax: {
      type: Number,
      default: 0,
      min: 0,
    },
    shipping: {
      type: Number,
      default: 0,
      min: 0,
    },
    discount: {
      type: Number,
      default: 0,
      min: 0,
    },
    total: {
      type: Number,
      default: 0,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
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

const Cart = mongoose.model('Cart', cartSchema);

module.exports = Cart;
