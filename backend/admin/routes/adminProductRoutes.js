const express = require('express');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const {
  getProductCategoriesForAdmin,
  listProductsForAdmin,
  getProductByIdForAdmin,
  createProductAsAdmin,
  updateProductAsAdmin,
  deleteProductAsAdmin,
  restoreProductAsAdmin,
} = require('../controller/adminProductController');

const router = express.Router();

router.use(protectAdmin);

router.get('/categories', getProductCategoriesForAdmin);
router.get('/', listProductsForAdmin);
router.get('/:id', getProductByIdForAdmin);
router.post('/', createProductAsAdmin);
router.put('/:id', updateProductAsAdmin);
router.delete('/:id', deleteProductAsAdmin);
router.patch('/:id/restore', restoreProductAsAdmin);

module.exports = router;
