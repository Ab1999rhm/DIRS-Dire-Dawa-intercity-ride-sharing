const express = require('express');
const router = express.Router();
const supportController = require('../../controllers/support/supportController');
const { validateOptionalApiKey } = require('../../middleware/apiKey');

router.get('/faqs', validateOptionalApiKey, supportController.getPublicFAQs);
router.get('/faqs/:faqId', validateOptionalApiKey, supportController.getPublicFAQ);
router.post('/faqs/:faqId/feedback', supportController.publicFAQFeedback);

module.exports = router;
