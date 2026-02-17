const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../models/User');
const { getJwtSecret } = require('../config/env');

const buildAuthResponse = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
});

const generateToken = (userId) =>
  jwt.sign({ id: userId }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });

const registerUser = async (req, res) => {
  try {
    const { name, email, password, confirmpassword, confirmPassword } = req.body;
    const normalizedConfirmPassword = confirmpassword || confirmPassword;

    if (!name || !email || !password || !normalizedConfirmPassword) {
      return res.status(400).json({ message: 'Name, email, password, and confirm password are required' });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters' });
    }

    if (String(password) !== String(normalizedConfirmPassword)) {
      return res.status(400).json({ message: 'Passwords do not match' });
    }

    const normalizedEmail = String(email).toLowerCase().trim();
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists with this email' });
    }

    const hashedPassword = await bcrypt.hash(String(password), 12);

    const user = await User.create({
      name: String(name).trim(),
      email: normalizedEmail,
      password: hashedPassword,
      confirmpassword: hashedPassword,
    });

    const token = generateToken(user._id);

    return res.status(201).json({
      message: 'Registration successful',
      token,
      user: buildAuthResponse(user),
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      message: 'Failed to register user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const isPasswordValid = await bcrypt.compare(String(password), user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);

    return res.status(200).json({
      message: 'Login successful',
      token,
      user: buildAuthResponse(user),
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'Failed to login user',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

const getCurrentUser = async (req, res) => {
  return res.status(200).json({
    user: buildAuthResponse(req.user),
  });
};

const logoutUser = async (req, res) => {
  return res.status(200).json({ message: 'Logout successful' });
};

const refreshToken = async (req, res) => {
  const token = generateToken(req.user._id);

  return res.status(200).json({
    message: 'Token refreshed',
    token,
    user: buildAuthResponse(req.user),
  });
};

module.exports = {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  refreshToken,
};
