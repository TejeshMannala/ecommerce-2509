const mongoose = require('mongoose');
const User = require('../../models/User');

const listUsersForAdmin = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, sortBy = 'createdAt', order = 'desc' } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const sortDirection = String(order).toLowerCase() === 'asc' ? 1 : -1;

    const query = {};
    if (search) {
      const orConditions = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.unshift({ _id: search });
      }
      query.$or = orConditions;
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password -confirmpassword')
        .sort({ [sortBy]: sortDirection })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      User.countDocuments(query),
    ]);

    return res.status(200).json({
      users,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Admin list users error:', error);
    return res.status(500).json({
      message: 'Failed to fetch users',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getUserByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findById(id).select('-password -confirmpassword');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({ user });
  } catch (error) {
    console.error('Admin get user by id error:', error);
    return res.status(500).json({
      message: 'Failed to fetch user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const updateUserAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const updates = {};
    if (name !== undefined) updates.name = String(name).trim();
    if (email !== undefined) updates.email = String(email).toLowerCase().trim();

    const user = await User.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).select('-password -confirmpassword');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'User updated successfully',
      user,
    });
  } catch (error) {
    console.error('Admin update user error:', error);
    if (error.code === 11000) {
      return res.status(409).json({ message: 'Email already exists' });
    }
    return res.status(500).json({
      message: 'Failed to update user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const deleteUserAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid user id' });
    }

    const user = await User.findByIdAndDelete(id).select('-password -confirmpassword');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    return res.status(200).json({
      message: 'User deleted successfully',
      user,
    });
  } catch (error) {
    console.error('Admin delete user error:', error);
    return res.status(500).json({
      message: 'Failed to delete user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  listUsersForAdmin,
  getUserByIdForAdmin,
  updateUserAsAdmin,
  deleteUserAsAdmin,
};
