const mongoose = require('mongoose');

const adminSchema = new mongoose.Schema(
  {
    loginUserName: {
      type: String,
      required: [true, 'Login username is required'],
      unique: true,
      trim: true,
      minlength: [3, 'Login username must be at least 3 characters'],
      maxlength: [30, 'Login username cannot exceed 30 characters'],
      index: true,
    },
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
  },
  {
    timestamps: true,
  }
);

const Admin = mongoose.model('Admin', adminSchema);

module.exports = Admin;
