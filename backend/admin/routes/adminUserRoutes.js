const express = require('express');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const {
  listUsersForAdmin,
  getUserByIdForAdmin,
  updateUserAsAdmin,
  deleteUserAsAdmin,
} = require('../controller/adminUserController');

const router = express.Router();

router.use(protectAdmin);

router.get('/', listUsersForAdmin);
router.get('/:id', getUserByIdForAdmin);
router.patch('/:id', updateUserAsAdmin);
router.delete('/:id', deleteUserAsAdmin);

module.exports = router;
