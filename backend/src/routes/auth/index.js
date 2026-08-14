const express = require('express');
const router = express.Router();
const authController = require('../../controllers/auth/authController');
const documentController = require('../../controllers/auth/documentController');
const { protect } = require('../../middleware/auth');
const upload = require('../../middleware/upload');
const {
  validateRegistration,
  validateLogin,
  validateOTP,
  validateEmailOTP,
  validateSendEmailOTP,
  validateUpdateProfile,
  validateUpdateLocation,
  validateForgotPassword,
  validateVerifyResetOTP,
  validateResetPassword
} = require('../../middleware/validation');

/**
 * @swagger
 * /auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [firstName, lastName, phoneNumber, password, role]
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *                 example: "+251911111111"
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *                 minLength: 6
 *               role:
 *                 type: string
 *                 enum: [passenger, driver]
 *     responses:
 *       201:
 *         description: Registration successful
 *       400:
 *         description: Validation error or phone already registered
 */
router.post('/register', validateRegistration, authController.register);

/**
 * @swagger
 * /auth/check-duplicate:
 *   post:
 *     summary: Check if email or phone is already registered (no account is created)
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email and phone are available
 *       409:
 *         description: Email or phone already registered
 */
router.post('/check-duplicate', authController.checkDuplicate);

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with phone number and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, password]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', validateLogin, authController.login);

/**
 * @swagger
 * /auth/refresh-token:
 *   post:
 *     summary: Refresh access token
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [refreshToken]
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: New tokens generated
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh-token', authController.refreshToken);

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send OTP to phone number
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP sent successfully
 */
router.post('/send-otp', authController.sendOTP);

/**
 * @swagger
 * /auth/send-email-otp:
 *   post:
 *     summary: Send OTP to email address
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *     responses:
 *       200:
 *         description: OTP sent to email
 */
router.post('/send-email-otp', validateSendEmailOTP, authController.sendEmailOTP);

/**
 * @swagger
 * /auth/verify-otp:
 *   post:
 *     summary: Verify phone OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, otp]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Phone verified
 */
router.post('/verify-otp', validateOTP, authController.verifyOTP);

/**
 * @swagger
 * /auth/verify-email-otp:
 *   post:
 *     summary: Verify email OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, otp]
 *             properties:
 *               email:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified
 */
router.post('/verify-email-otp', validateEmailOTP, authController.verifyEmailOTP);

/**
 * @swagger
 * /auth/forgot-password:
 *   post:
 *     summary: Request password reset OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset OTP sent
 */
router.post('/forgot-password', validateForgotPassword, authController.forgotPassword);

/**
 * @swagger
 * /auth/verify-reset-otp:
 *   post:
 *     summary: Verify password reset OTP before entering a new password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, otp]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *     responses:
 *       200:
 *         description: OTP verified
 */
router.post('/verify-reset-otp', validateVerifyResetOTP, authController.verifyResetOTP);

/**
 * @swagger
 * /auth/reset-password:
 *   post:
 *     summary: Reset password with OTP
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [phoneNumber, otp, newPassword]
 *             properties:
 *               phoneNumber:
 *                 type: string
 *               otp:
 *                 type: string
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *     responses:
 *       200:
 *         description: Password reset successful
 */
router.post('/reset-password', validateResetPassword, authController.resetPassword);

/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile
 *       401:
 *         description: Unauthorized
 */
router.get('/me', protect, authController.getMe);

/**
 * @swagger
 * /auth/profile:
 *   put:
 *     summary: Update user profile
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               preferredLanguage:
 *                 type: string
 *                 enum: [en, am, om, so]
 *     responses:
 *       200:
 *         description: Profile updated
 */
router.put('/profile', protect, validateUpdateProfile, authController.updateProfile);

/**
 * @swagger
 * /auth/location:
 *   put:
 *     summary: Update driver/passenger location
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [coordinates]
 *             properties:
 *               coordinates:
 *                 type: array
 *                 items:
 *                   type: number
 *                 example: [41.85, 9.6]
 *     responses:
 *       200:
 *         description: Location updated
 */
router.put('/location', protect, validateUpdateLocation, authController.updateLocation);

router.put('/driver/status', protect, authController.updateDriverStatus);

router.put('/driver/destination', protect, async (req, res) => {
  try {
    const User = require('../../models/User');
    const { city, coordinates } = req.body;
    const update = {
      intendedDestination: city ? { city, coordinates, updatedAt: new Date() } : { city: null, coordinates: null, updatedAt: null }
    };
    await User.findByIdAndUpdate(req.user._id, update);
    res.json({ message: 'Destination updated', intendedDestination: update.intendedDestination });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/documents', protect, documentController.getDocuments);

router.post('/send-phone-otp', authController.sendPhoneOTP);
router.post('/verify-phone-otp', authController.verifyPhoneOTP);

router.post('/profile-photo', protect, authController.uploadProfilePhoto);

router.post('/documents', protect, documentController.uploadDocuments);

router.post('/vehicle-documents', protect, documentController.uploadVehicleDocuments);



router.post('/logout', protect, authController.logout);

module.exports = router;
