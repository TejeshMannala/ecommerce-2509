const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');
const { isProduction, assertRequiredEnv } = require('./config/env');
const authRoutes = require('./routes/authRoutes');

// Admin routes
const adminAuthRoutes = require('./admin/routes/adminAuthRoutes');
const adminCategoryRoutes = require('./admin/routes/adminCategoryRoutes');
const adminProductRoutes = require('./admin/routes/adminProductRoutes');
const adminUploadRoutes = require('./admin/routes/adminUploadRoutes');
const adminOrderRoutes = require('./admin/routes/adminOrderRoutes');
const adminUserRoutes = require('./admin/routes/adminUserRoutes');
const adminSupportMessageRoutes = require('./admin/routes/adminSupportMessageRoutes');

// User routes
const supportMessageRoutes = require('./routes/supportMessageRoutes');
const cartRoutes = require('./routes/cartRoutes');
const wishlistRoutes = require('./routes/wishlistRoutes');
const orderRoutes = require('./routes/orderRoutes');
const productRoutes = require('./routes/productRoutes');

// Import models to register them with Mongoose
require('./models/User');
require('./admin/models/Admin');
require('./models/Product');
require('./models/Cart');
require('./models/Wishlist');
require('./models/Order');
require('./admin/models/SupportMessage');

assertRequiredEnv();

const app = express();

const parseCorsOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const envOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
const explicitOrigins = [
  ...envOrigins,
  String(process.env.FRONTEND_URL || '').trim(),
  String(process.env.ADMIN_FRONTEND_URL || '').trim(),
].filter(Boolean);

const allowedOrigins = explicitOrigins.length
  ? Array.from(new Set(explicitOrigins))
  : ['http://localhost:5173', 'http://localhost:5174'];

if (isProduction() && explicitOrigins.length === 0) {
  throw new Error('Set CORS_ORIGINS (or FRONTEND_URL/ADMIN_FRONTEND_URL) in production');
}

const trustProxyValue = process.env.TRUST_PROXY;
if (trustProxyValue !== undefined) {
  const trimmed = String(trustProxyValue).trim().toLowerCase();
  if (trimmed === 'true') {
    app.set('trust proxy', true);
  } else if (trimmed === 'false') {
    app.set('trust proxy', false);
  } else if (!Number.isNaN(Number(trimmed))) {
    app.set('trust proxy', Number(trimmed));
  }
} else if (isProduction()) {
  app.set('trust proxy', 1);
}

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error('Not allowed by CORS'));
    },
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// 🔥 Health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ecommerce-api' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 🔥 API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin-auth', adminAuthRoutes);
app.use('/api/admin/product-categories', adminCategoryRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/uploads', adminUploadRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/support-messages', adminSupportMessageRoutes);

app.use('/api/support-messages', supportMessageRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

// 🔥 Error Handlers
app.use((error, req, res, next) => {
  if (error?.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }
  return next(error);
});

// 🔥 404 Handler
app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ message: 'Route not found' });
});

// 🔥 Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Server startup error:', error.message);
    process.exit(1);
  }
};

startServer();