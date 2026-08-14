const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payments/paymentController');
const { protect, authorize } = require('../../middleware/auth');
const { validatePayment, validatePaymentRoute, validatePaymentDetailRoute, validateWithdrawal } = require('../../middleware/validation');

router.post('/trip/:tripId', protect, validatePaymentRoute, validatePayment, paymentController.processPayment);
router.get('/wallet', protect, paymentController.getWallet);
router.post('/wallet/topup', protect, paymentController.walletTopUp);
router.post('/wallet/verify', protect, paymentController.verifyTopUp);
router.post('/wallet/withdraw', protect, paymentController.walletWithdraw);
router.get('/history', protect, paymentController.getPaymentHistory);
router.get('/earnings', protect, authorize('driver'), paymentController.getDriverEarnings);
router.post('/withdraw', protect, authorize('driver'), validateWithdrawal, paymentController.requestWithdrawal);
router.post('/chapa/webhook', paymentController.chapaWebhook);
router.get('/:paymentId', protect, validatePaymentDetailRoute, paymentController.getPaymentDetails);

module.exports = router;
