const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const Admin = require('../models/Admin');
const { getJwtSecret } = require('../../config/env');

const buildAdminAuthResponse = (admin) => ({
  id: admin._id,
  loginUserName: admin.loginUserName,
  name: admin.name,
});

const generateToken = (adminId) =>
  jwt.sign({ id: adminId, role: 'admin' }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const signupAdmin = async (req, res) => {
  try {
    const { loginUserName, name, password, confirmPassword } = req.body;

    if (!loginUserName || !name || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Login username, name, password, and confirm password are required',
      });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (String(password) !== String(confirmPassword)) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const normalizedLoginUserName = String(loginUserName).trim();
    const existingAdmin = await Admin.findOne({ loginUserName: normalizedLoginUserName });
    if (existingAdmin) {
      return res.status(409).json({ message: 'Admin already exists with this login username' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);
    const admin = await Admin.create({
      loginUserName: normalizedLoginUserName,
      name: String(name).trim(),
      password: hashedPassword,
    });

    const token = generateToken(admin._id);

    return res.status(201).json({
      message: 'Admin signup successful',
      token,
      admin: buildAdminAuthResponse(admin),
    });
  } catch (error) {
    console.error('Admin signup error:', error);
    return res.status(500).json({
      message: 'Failed to signup admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const loginAdmin = async (req, res) => {
  try {
    const { loginUserName, password } = req.body;

    if (!loginUserName || !password) {
      return res.status(400).json({ message: 'Login username and password are required' });
    }

    const admin = await Admin.findOne({ loginUserName: String(loginUserName).trim() }).select(
      '+password'
    );
    if (!admin) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(String(password), admin.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(admin._id);

    return res.status(200).json({
      message: 'Admin login successful',
      token,
      admin: buildAdminAuthResponse(admin),
    });
  } catch (error) {
    console.error('Admin login error:', error);
    return res.status(500).json({
      message: 'Failed to login admin',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

module.exports = {
  signupAdmin,
  loginAdmin,
};
