const express = require('express');
const {
  createSupportMessage,
  listSupportMessagesForUser,
} = require('../controller/supportMessageController');

const router = express.Router();

router.get('/', listSupportMessagesForUser);
router.post('/', createSupportMessage);

module.exports = router;
