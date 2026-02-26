const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');
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

// Register models
require('./models/User');
require('./admin/models/Admin');
require('./models/Product');
require('./models/Cart');
require('./models/Wishlist');
require('./models/Order');
require('./admin/models/SupportMessage');

const app = express();

let dbConnectionPromise = null;
const ensureDbConnection = () => {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDB().catch((error) => {
      dbConnectionPromise = null;
      throw error;
    });
  }
  return dbConnectionPromise;
};

/* ===========================
   TRUST PROXY (Required for Render/Vercel)
=========================== */
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

/* ===========================
   CORS CONFIGURATION
=========================== */

const parseCorsOrigins = (value) =>
  String(value || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

const envOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);
const allowedOrigins = Array.from(
  new Set([
    ...envOrigins,
    process.env.FRONTEND_URL,
    process.env.ADMIN_FRONTEND_URL,
    'http://localhost:5173',
    'http://localhost:5174',
  ].filter(Boolean))
);

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      console.log('Blocked by CORS:', origin);
      return callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
  })
);

/* ===========================
   MIDDLEWARE
=========================== */

app.get('/favicon.ico', (_req, res) => {
  res.status(204).end();
});

app.use('/api', async (req, res, next) => {
  if (req.path === '/health') {
    return next();
  }
  try {
    await ensureDbConnection();
    next();
  } catch (error) {
    next(error);
  }
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
const runtimeUploadsDir = process.env.VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(__dirname, 'uploads');
app.use('/uploads', express.static(runtimeUploadsDir));

/* ===========================
   HEALTH CHECK ROUTES
=========================== */

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'ecommerce-api' });
});

app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

/* ===========================
   API ROUTES
=========================== */

// Auth
app.use('/api/auth', authRoutes);
app.use('/api/admin-auth', adminAuthRoutes);

// Admin
app.use('/api/admin/product-categories', adminCategoryRoutes);
app.use('/api/admin/products', adminProductRoutes);
app.use('/api/admin/uploads', adminUploadRoutes);
app.use('/api/admin/orders', adminOrderRoutes);
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/support-messages', adminSupportMessageRoutes);

// User
app.use('/api/support-messages', supportMessageRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/products', productRoutes);

/* ===========================
   ERROR HANDLER
=========================== */

app.use((err, req, res, next) => {
  console.error('Server Error:', err.message);

  if (err.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  res.status(500).json({ message: 'Internal Server Error' });
});

/* ===========================
   404 HANDLER
=========================== */

app.use((req, res) => {
  console.log('404 - Route not found:', req.method, req.path);
  res.status(404).json({ message: 'Route not found' });
});

module.exports = app;
