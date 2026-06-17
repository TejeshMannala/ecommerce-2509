const express = require('express');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');

const adminProductRoutes = require('./adminProductRoutes');
const adminOrderRoutes = require('./adminOrderRoutes');
const adminUserRoutes = require('./adminUserRoutes');
const adminCategoryRoutes = require('./adminCategoryRoutes');
const adminSupportMessageRoutes = require('./adminSupportMessageRoutes');
const adminUploadRoutes = require('./adminUploadRoutes');

const router = express.Router();

router.use(protectAdmin);

router.use('/products', adminProductRoutes);
router.use('/orders', adminOrderRoutes);
router.use('/users', adminUserRoutes);
router.use('/categories', adminCategoryRoutes);
router.use('/support-messages', adminSupportMessageRoutes);
router.use('/uploads', adminUploadRoutes);

module.exports = router;
