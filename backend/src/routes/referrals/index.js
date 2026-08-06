const express = require('express');
const router = express.Router();
const referralController = require('../../controllers/referrals/referralController');
const { protect } = require('../../middleware/auth');

router.get('/code', protect, referralController.getMyReferralCode);
router.get('/list', protect, referralController.getMyReferrals);
router.post('/apply', protect, referralController.applyReferralCode);
router.get('/validate/:referralCode', referralController.validateReferralCode);

module.exports = router;
