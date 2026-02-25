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

const app = express();

// 🔥 Middlewares
app.use(cors());
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

// 🔥 404 Handler
app.use((req, res) => {
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