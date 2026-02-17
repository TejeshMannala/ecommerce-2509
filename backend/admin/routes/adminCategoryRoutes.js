const express = require('express');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const { getProductCategoriesForAdmin } = require('../controller/adminProductController');

const router = express.Router();

router.use(protectAdmin);
router.get('/', getProductCategoriesForAdmin);

module.exports = router;
