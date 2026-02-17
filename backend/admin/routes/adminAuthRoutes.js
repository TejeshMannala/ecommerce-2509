const express = require('express');
const rateLimit = require('express-rate-limit');
const { signupAdmin, loginAdmin } = require('../controller/adminAuthController');

const router = express.Router();
const isProd = process.env.NODE_ENV === 'production';

const adminSignupRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: isProd ? 3 : 1000,
  message: {
    message: 'Too many admin signup attempts from this IP, please try again after 1 hour.',
    statusCode: 429,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

const adminLoginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 5 : 1000,
  message: {
    message: 'Too many admin login attempts from this IP, please try again after 15 minutes.',
    statusCode: 429,
    lockedUntil: Date.now() + 15 * 60 * 1000,
  },
  standardHeaders: true,
  legacyHeaders: false,
});

router.post('/signup', adminSignupRateLimit, signupAdmin);
router.post('/login', adminLoginRateLimit, loginAdmin);

module.exports = router;
