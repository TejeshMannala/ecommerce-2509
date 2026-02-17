const mongoose = require('mongoose');
const SupportMessage = require('../models/SupportMessage');

const listSupportMessagesForAdmin = async (req, res) => {
  try {
    const {
      page = 1,
      limit = 20,
      status,
      search,
      includeDeleted = 'false',
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    const parsedPage = Math.max(1, parseInt(page, 10) || 1);
    const parsedLimit = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const sortDirection = String(order).toLowerCase() === 'asc' ? 1 : -1;

    const query = {};
    if (String(includeDeleted).toLowerCase() !== 'true') query.isDeleted = false;
    if (status) query.status = status;

    if (search) {
      const orConditions = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } },
      ];
      if (mongoose.Types.ObjectId.isValid(search)) {
        orConditions.unshift({ _id: search });
      }
      query.$or = orConditions;
    }

    const [messages, total] = await Promise.all([
      SupportMessage.find(query)
        .populate('respondedBy', 'loginUserName name')
        .sort({ [sortBy]: sortDirection })
        .skip((parsedPage - 1) * parsedLimit)
        .limit(parsedLimit),
      SupportMessage.countDocuments(query),
    ]);

    return res.status(200).json({
      messages,
      pagination: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        totalPages: Math.ceil(total / parsedLimit),
      },
    });
  } catch (error) {
    console.error('Admin list support messages error:', error);
    return res.status(500).json({
      message: 'Failed to fetch support messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getSupportMessageByIdForAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid support message id' });
    }

    const message = await SupportMessage.findById(id).populate('respondedBy', 'loginUserName name');
    if (!message) {
      return res.status(404).json({ message: 'Support message not found' });
    }

    return res.status(200).json({ message });
  } catch (error) {
    console.error('Admin get support message by id error:', error);
    return res.status(500).json({
      message: 'Failed to fetch support message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const updateSupportMessageStatusAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminNotes } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid support message id' });
    }

    if (!status || !['new', 'in_progress', 'resolved', 'closed'].includes(status)) {
      return res.status(400).json({ message: 'Invalid support message status' });
    }

    const updates = {
      status,
      respondedBy: req.admin?._id,
    };

    if (adminNotes !== undefined) updates.adminNotes = adminNotes;
    if (status === 'resolved') updates.resolvedAt = new Date();

    const message = await SupportMessage.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('respondedBy', 'loginUserName name');

    if (!message) {
      return res.status(404).json({ message: 'Support message not found' });
    }

    return res.status(200).json({
      message: 'Support message updated successfully',
      supportMessage: message,
    });
  } catch (error) {
    console.error('Admin update support message status error:', error);
    return res.status(500).json({
      message: 'Failed to update support message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const replySupportMessageAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { adminReply, status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid support message id' });
    }

    if (!adminReply || !String(adminReply).trim()) {
      return res.status(400).json({ message: 'Admin reply is required' });
    }

    const updates = {
      adminReply: String(adminReply).trim(),
      repliedAt: new Date(),
      respondedBy: req.admin?._id,
    };

    if (status && ['new', 'in_progress', 'resolved', 'closed'].includes(status)) {
      updates.status = status;
      if (status === 'resolved') updates.resolvedAt = new Date();
    }

    const supportMessage = await SupportMessage.findByIdAndUpdate(id, updates, {
      new: true,
      runValidators: true,
    }).populate('respondedBy', 'loginUserName name');

    if (!supportMessage) {
      return res.status(404).json({ message: 'Support message not found' });
    }

    return res.status(200).json({
      message: 'Reply sent successfully',
      supportMessage,
    });
  } catch (error) {
    console.error('Admin reply support message error:', error);
    return res.status(500).json({
      message: 'Failed to send reply',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const deleteSupportMessageAsAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid support message id' });
    }

    const message = await SupportMessage.findByIdAndUpdate(
      id,
      { $set: { isDeleted: true } },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ message: 'Support message not found' });
    }

    return res.status(200).json({ message: 'Support message deleted successfully' });
  } catch (error) {
    console.error('Admin delete support message error:', error);
    return res.status(500).json({
      message: 'Failed to delete support message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  listSupportMessagesForAdmin,
  getSupportMessageByIdForAdmin,
  updateSupportMessageStatusAsAdmin,
  replySupportMessageAsAdmin,
  deleteSupportMessageAsAdmin,
};
