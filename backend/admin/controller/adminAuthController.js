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
    const { email, name, loginUserName, password, confirmPassword } = req.body;

    if (!email || !name || !loginUserName || !password || !confirmPassword) {
      return res.status(400).json({
        message: 'Login username, name, password, and confirm password are required',
      });
    }

    if (!email.includes('@')) {
      return res.status(400).json({ message: 'Please enter a valid email address' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (String(password) !== String(confirmPassword)) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedLoginUserName = String(loginUserName).trim().toLowerCase();
    
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { email: normalizedEmail },
        { loginUserName: normalizedLoginUserName }
      ]
    });
    
    if (existingAdmin) {
      if (existingAdmin.email === normalizedEmail) {
        return res.status(409).json({ message: 'Admin already exists with this email' });
      }
      return res.status(409).json({ message: 'Admin already exists with this username' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);
    const admin = await Admin.create({
      email: normalizedEmail,
      name: String(name).trim(),
      loginUserName: normalizedLoginUserName,
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
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const admin = await Admin.findOne({ email: String(email).trim().toLowerCase() }).select(
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
