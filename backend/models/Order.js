const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      required: true,
      trim: true,
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
    },
    image: {
      type: String,
      required: true,
    },
    sku: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const addressSchema = new mongoose.Schema(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      match: [/^\+?[\d\s-()]{10,}$/, 'Please enter a valid phone number'],
    },
    address: {
      type: String,
      required: true,
      trim: true,
      minlength: [5, 'Address must be at least 5 characters'],
    },
    city: {
      type: String,
      required: true,
      trim: true,
    },
    state: {
      type: String,
      required: true,
      trim: true,
    },
    zipCode: {
      type: String,
      required: true,
      trim: true,
      match: [/^(\d{5}(-\d{4})?|\d{6})$/, 'Please enter a valid ZIP/PIN code'],
    },
    country: {
      type: String,
      required: true,
      trim: true,
      default: 'USA',
    },
  },
  { _id: false }
);

const paymentSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      required: true,
      enum: ['card', 'upi', 'phonepe', 'googlepay', 'paytm', 'amazonpay', 'cod'],
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      trim: true,
    },
    cardLast4: {
      type: String,
      trim: true,
      maxlength: 4,
    },
    cardholderName: {
      type: String,
      trim: true,
    },
    upiId: {
      type: String,
      trim: true,
    },
    phonePeNumber: {
      type: String,
      trim: true,
    },
    googlePayNumber: {
      type: String,
      trim: true,
    },
    paytmNumber: {
      type: String,
      trim: true,
    },
    amazonPayNumber: {
      type: String,
      trim: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    paymentDate: {
      type: Date,
    },
    failureReason: {
      type: String,
      trim: true,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderId: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      index: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    items: [orderItemSchema],
    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
    tax: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    shipping: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    discount: {
      type: Number,
      min: 0,
      default: 0,
    },
    total: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: 'USD',
      uppercase: true,
    },
    status: {
      type: String,
      enum: {
        values: [
          'pending',
          'confirmed',
          'processing',
          'shipped',
          'out_for_delivery',
          'delivered',
          'cancelled',
          'refunded',
          'failed',
        ],
        message: 'Status must be one of the predefined values',
      },
      default: 'pending',
      index: true,
    },
    payment: paymentSchema,
    shippingAddress: addressSchema,
    billingAddress: addressSchema,
    shippingMethod: {
      type: String,
      enum: ['standard', 'express', 'overnight'],
      default: 'standard',
    },
    estimatedDelivery: {
      type: Date,
    },
    tracking: {
      carrier: {
        type: String,
        trim: true,
        enum: ['fedex', 'ups', 'usps', 'dhl', 'other'],
      },
      trackingNumber: {
        type: String,
        trim: true,
      },
      trackingUrl: {
        type: String,
        trim: true,
        validate: {
          validator: function (v) {
            return !v || /^https?:\/\/.+\..+$/.test(v);
          },
          message: 'Invalid tracking URL',
        },
      },
      status: {
        type: String,
        enum: ['pending', 'in_transit', 'out_for_delivery', 'delivered', 'failed'],
        default: 'pending',
      },
      lastUpdated: {
        type: Date,
      },
    },
    notes: {
      type: String,
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },
    cancellation: {
      reason: {
        type: String,
        enum: [
          'customer_request',
          'out_of_stock',
          'payment_failed',
          'fraud_suspected',
          'other',
        ],
      },
      notes: {
        type: String,
        maxlength: [500, 'Cancellation notes cannot exceed 500 characters'],
      },
      cancelledAt: Date,
      cancelledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    refund: {
      amount: {
        type: Number,
        min: 0,
      },
      reason: {
        type: String,
        enum: ['customer_request', 'defective', 'wrong_item', 'other'],
      },
      status: {
        type: String,
        enum: ['pending', 'processed', 'failed'],
        default: 'pending',
      },
      processedAt: Date,
      processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    },
    metadata: {
      userAgent: String,
      ipAddress: String,
      sessionId: String,
    },
    isDeleted: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ 'payment.status': 1 });
orderSchema.index({ 'tracking.trackingNumber': 1 });

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
