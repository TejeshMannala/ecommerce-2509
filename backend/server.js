const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminAuthRoutes = require('./admin/routes/adminAuthRoutes');
const adminCategoryRoutes = require('./admin/routes/adminCategoryRoutes');
const adminProductRoutes = require('./admin/routes/adminProductRoutes');
const adminUploadRoutes = require('./admin/routes/adminUploadRoutes');
const adminOrderRoutes = require('./admin/routes/adminOrderRoutes');
const adminUserRoutes = require('./admin/routes/adminUserRoutes');
const adminSupportMessageRoutes = require('./admin/routes/adminSupportMessageRoutes');
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

const isProduction = () => process.env.NODE_ENV === 'production';

const assertRequiredEnv = () => {
  const missing = [];

  if (!String(process.env.MONGO_URI || '').trim()) {
    missing.push('MONGO_URI');
  }

  if (!String(process.env.JWT_SECRET || '').trim()) {
    missing.push('JWT_SECRET');
  }

  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  if (isProduction() && process.env.JWT_SECRET === 'dev-secret-change-me') {
    throw new Error('JWT_SECRET cannot use the development default in production');
  }
};

assertRequiredEnv();

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

const defaultAllowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'https://freshbay.onrender.com',
  'https://freshbay-admin.onrender.com',
];

const allowedOrigins = explicitOrigins.length
  ? Array.from(new Set([...defaultAllowedOrigins, ...explicitOrigins]))
  : defaultAllowedOrigins;

if (isProduction() && explicitOrigins.length === 0) {
  console.warn('WARNING: CORS_ORIGINS is not set. Using default allowed origins.');
}

const corsOptions = {
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
};

const app = express();

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

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    service: 'freshbay-api',
    database: 'connected',
    allowedOrigins,
  });
});

app.get('/', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'freshbay-api' });
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'freshbay-api' });
});

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

app.use((error, req, res, next) => {
  console.error('GLOBAL ERROR HANDLER:', error);
  if (error?.message === 'Not allowed by CORS') {
    return res.status(403).json({ message: 'Origin not allowed' });
  }

  return res.status(500).json({
    message: 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
});

app.use((req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

const startServer = async () => {
  try {
    await connectDB();
    const PORT = process.env.PORT || 5000;
    const jwtSecret = process.env.JWT_SECRET;
    
    console.log(`Server starting on port ${PORT}`);
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error(`Server startup error: ${error.message}`);
    process.exit(1);
  }
};

startServer();
