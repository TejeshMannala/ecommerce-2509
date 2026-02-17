const express = require('express');
const { protectAdmin } = require('../middleware/adminAuthMiddleware');
const {
  listSupportMessagesForAdmin,
  getSupportMessageByIdForAdmin,
  updateSupportMessageStatusAsAdmin,
  replySupportMessageAsAdmin,
  deleteSupportMessageAsAdmin,
} = require('../controller/adminSupportMessageController');

const router = express.Router();

router.use(protectAdmin);

router.get('/', listSupportMessagesForAdmin);
router.get('/:id', getSupportMessageByIdForAdmin);
router.patch('/:id/status', updateSupportMessageStatusAsAdmin);
router.patch('/:id/reply', replySupportMessageAsAdmin);
router.delete('/:id', deleteSupportMessageAsAdmin);

module.exports = router;
