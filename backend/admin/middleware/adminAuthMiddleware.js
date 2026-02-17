const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { getJwtSecret } = require('../../config/env');

const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Not authorized, admin token missing' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, getJwtSecret());

    if (decoded?.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied, admin privileges required' });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      return res.status(401).json({ message: 'Not authorized, admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, admin token invalid' });
  }
};

module.exports = { protectAdmin };
