const mongoose = require('mongoose');

const supportMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please enter a valid email'],
      index: true,
    },
    mobile: {
      type: String,
      required: [true, 'Mobile number is required'],
      trim: true,
      match: [/^\+?[\d\s-()]{10,15}$/, 'Please enter a valid mobile number'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [120, 'Subject cannot exceed 120 characters'],
      index: true,
    },
    message: {
      type: String,
      required: [true, 'Message is required'],
      trim: true,
      minlength: [10, 'Message must be at least 10 characters'],
      maxlength: [2000, 'Message cannot exceed 2000 characters'],
    },
    status: {
      type: String,
      enum: ['new', 'in_progress', 'resolved', 'closed'],
      default: 'new',
      index: true,
    },
    adminNotes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Admin notes cannot exceed 1000 characters'],
    },
    adminReply: {
      type: String,
      trim: true,
      maxlength: [2000, 'Admin reply cannot exceed 2000 characters'],
    },
    repliedAt: {
      type: Date,
    },
    resolvedAt: {
      type: Date,
    },
    respondedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin',
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

supportMessageSchema.index({ createdAt: -1 });

const SupportMessage = mongoose.model('SupportMessage', supportMessageSchema);

module.exports = SupportMessage;
