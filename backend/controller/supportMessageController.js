const SupportMessage = require('../admin/models/SupportMessage');

const createSupportMessage = async (req, res) => {
  try {
    const { name, email, mobile, subject, message } = req.body;

    if (!name || !email || !mobile || !subject || !message) {
      return res.status(400).json({
        message: 'name, email, mobile, subject, and message are required',
      });
    }

    const supportMessage = await SupportMessage.create({
      name: String(name).trim(),
      email: String(email).toLowerCase().trim(),
      mobile: String(mobile).trim(),
      subject: String(subject).trim(),
      message: String(message).trim(),
    });

    return res.status(201).json({
      message: 'Support message submitted successfully',
      supportMessage,
    });
  } catch (error) {
    console.error('Create support message error:', error);
    return res.status(500).json({
      message: 'Failed to submit support message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const listSupportMessagesForUser = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || !String(email).trim()) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const messages = await SupportMessage.find({
      email: normalizedEmail,
      isDeleted: false,
    })
      .select('name email subject message status adminReply repliedAt createdAt updatedAt')
      .sort({ createdAt: -1 })
      .limit(20);

    return res.status(200).json({ messages });
  } catch (error) {
    console.error('List support messages for user error:', error);
    return res.status(500).json({
      message: 'Failed to fetch support messages',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  createSupportMessage,
  listSupportMessagesForUser,
};
