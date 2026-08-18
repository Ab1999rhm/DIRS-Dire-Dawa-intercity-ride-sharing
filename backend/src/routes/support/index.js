const express = require('express');
const router = express.Router();
const supportController = require('../../controllers/support/supportController');

router.get('/faqs', supportController.getPublicFAQs);
router.get('/faqs/:faqId', supportController.getPublicFAQ);
router.post('/faqs/:faqId/feedback', supportController.publicFAQFeedback);

module.exports = router;
