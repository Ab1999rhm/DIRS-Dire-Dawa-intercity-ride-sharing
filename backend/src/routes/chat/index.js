const express = require('express');
const router = express.Router();
const chatController = require('../../controllers/chat/chatController');
const { protect } = require('../../middleware/auth');

router.get('/unread', protect, chatController.getUnread);
router.get('/:tripId/messages', protect, chatController.getMessages);
router.post('/:tripId/messages', protect, chatController.sendMessage);
router.post('/:tripId/read', protect, chatController.markRead);

module.exports = router;