const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');
const { getJwtSecret } = require('../../config/env');

const protectAdmin = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization || '';
    if (!authHeader.startsWith('Bearer ')) {
      console.log('No Bearer token found in auth header:', authHeader);
      return res.status(401).json({ message: 'Not authorized, admin token missing' });
    }

    const token = authHeader.split(' ')[1];
    const jwtSecret = getJwtSecret();
    console.log('Verifying admin token:', token.substring(0, 20) + '...');
    console.log('Using JWT secret:', jwtSecret ? 'SECRET_PROVIDED' : 'MISSING');
    
    const decoded = jwt.verify(token, jwtSecret);
    console.log('Token decoded successfully:', decoded);

    if (decoded?.role !== 'admin') {
      console.log('Invalid role in token:', decoded?.role);
      return res.status(403).json({ message: 'Access denied, admin privileges required' });
    }

    const admin = await Admin.findById(decoded.id).select('-password');
    if (!admin) {
      console.log('Admin not found for ID:', decoded.id);
      return res.status(401).json({ message: 'Not authorized, admin not found' });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.log('Admin token verification failed:', error.message);
    return res.status(401).json({ message: 'Not authorized, admin token invalid' });
  }
};

module.exports = { protectAdmin };
