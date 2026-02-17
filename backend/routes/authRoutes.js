const express = require('express');
const rateLimit = require('express-rate-limit');
const {
  registerUser,
  loginUser,
  getCurrentUser,
  logoutUser,
  refreshToken,
} = require('../controller/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

// Rate limiter for login attempts: 5 attempts per 15 minutes
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: isProd ? 5 : 1000, // keep strict in prod, permissive for local API testing
  message: {
    message: 'Too many login attempts from this IP, please try again after 15 minutes.',
    statusCode: 429,
    lockedUntil: Date.now() + 15 * 60 * 1000
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Rate limiter for registration: 3 attempts per hour
const registerRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: isProd ? 3 : 1000, // keep strict in prod, permissive for local API testing
  message: {
    message: 'Too many registration attempts from this IP, please try again after 1 hour.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/register', registerRateLimit, registerUser);
router.post('/login', loginRateLimit, loginUser);
router.post('/logout', logoutUser);
router.post('/refresh', protect, refreshToken);
router.get('/me', protect, getCurrentUser);

module.exports = router;
