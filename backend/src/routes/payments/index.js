const express = require('express');
const router = express.Router();
const paymentController = require('../../controllers/payments/paymentController');
const { protect, authorize } = require('../../middleware/auth');
const { validatePayment, validatePaymentRoute, validatePaymentDetailRoute, validateWithdrawal } = require('../../middleware/validation');

router.post('/trip/:tripId', protect, validatePaymentRoute, validatePayment, paymentController.processPayment);
router.get('/wallet', protect, paymentController.getWallet);
router.post('/wallet/topup', protect, paymentController.walletTopUp);
router.post('/wallet/withdraw', protect, paymentController.walletWithdraw);
router.get('/history', protect, paymentController.getPaymentHistory);
router.get('/earnings', protect, authorize('driver'), paymentController.getDriverEarnings);
router.post('/withdraw', protect, authorize('driver'), validateWithdrawal, paymentController.requestWithdrawal);
router.get('/banks', protect, paymentController.getBanks);
router.get('/withdraw/verify/:reference', protect, paymentController.verifyWithdrawal);
router.post('/withdraw/reconcile', protect, authorize('admin'), paymentController.reconcileWithdrawals);
router.get('/withdrawals', protect, authorize('admin'), paymentController.getAdminWithdrawals);
router.post('/withdrawals/:id/approve', protect, authorize('admin'), paymentController.approveWithdrawal);
router.post('/withdrawals/:id/reject', protect, authorize('admin'), paymentController.rejectWithdrawal);
router.post('/chapa/approval', paymentController.chapaApproval);
router.post('/chapa/webhook', paymentController.chapaWebhook);
router.delete('/wallet/:paymentId', protect, validatePaymentDetailRoute, paymentController.deleteTransaction);
router.get('/:paymentId', protect, validatePaymentDetailRoute, paymentController.getPaymentDetails);

module.exports = router;
