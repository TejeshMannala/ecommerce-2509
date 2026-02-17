const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const {
  createProduct,
  getProducts,
  getProductsByCategory,
  searchProducts,
  getProductCategories,
  getProductById,
  updateProduct,
  deleteProduct,
} = require('../controller/productController');

const router = express.Router();

router.get('/', getProducts);
router.get('/search', searchProducts);
router.get('/categories', getProductCategories);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

router.post('/', protect, createProduct);
router.put('/:id', protect, updateProduct);
router.delete('/:id', protect, deleteProduct);

module.exports = router;
