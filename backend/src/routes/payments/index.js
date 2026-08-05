const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payments/paymentController');
const { protect, authorize } = require('../../middleware/auth');
const { validatePayment, validateObjectId, validateWithdrawal } = require('../../middleware/validation');

router.post('/trip/:tripId', protect, validateObjectId, validatePayment, paymentController.processPayment);
router.get('/:paymentId', protect, validateObjectId, paymentController.getPaymentDetails);
router.get('/history', protect, paymentController.getPaymentHistory);
router.get('/earnings', protect, authorize('driver'), paymentController.getDriverEarnings);
router.post('/withdraw', protect, authorize('driver'), validateWithdrawal, paymentController.requestWithdrawal);
router.post('/chapa/webhook', paymentController.chapaWebhook);

module.exports = router;
