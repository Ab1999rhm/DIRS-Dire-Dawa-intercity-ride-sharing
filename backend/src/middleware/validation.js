const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

const validateRegistration = [
  body('firstName').trim().notEmpty().withMessage('First name is required'),
  body('lastName').trim().notEmpty().withMessage('Last name is required'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('phoneNumber').matches(/^(\+251|0)?[97]\d{8}$/).withMessage('Valid Ethiopian phone number required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('role').isIn(['passenger', 'driver']).withMessage('Role must be passenger or driver'),
  handleValidation
];

const validateLogin = [
  body('phoneNumber').trim().notEmpty().withMessage('Phone number is required'),
  body('password').notEmpty().withMessage('Password is required'),
  handleValidation
];

const validateOTP = [
  body('phoneNumber').matches(/^(\+251|0)?[97]\d{8}$/).withMessage('Valid phone number required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits'),
  handleValidation
];

const validateEmailOTP = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits'),
  handleValidation
];

const validateSendEmailOTP = [
  body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
  handleValidation
];

const validateRideRequest = [
  body('pickupLocation.address').notEmpty().withMessage('Pickup address is required'),
  body('pickupLocation.coordinates').isArray({ min: 2, max: 2 }).withMessage('Pickup coordinates required'),
  body('dropoffLocation.address').notEmpty().withMessage('Dropoff address is required'),
  body('dropoffLocation.coordinates').isArray({ min: 2, max: 2 }).withMessage('Dropoff coordinates required'),
  body('estimatedFare').isNumeric().withMessage('Estimated fare must be a number'),
  handleValidation
];

const validateVehicle = [
  body('vehicleType').isIn(['car', 'minivan', 'minibus', 'bajaj', 'bus', 'sedan', 'bike', 'electric']).withMessage('Invalid vehicle type'),
  body('make').trim().notEmpty().withMessage('Vehicle make is required'),
  body('model').trim().notEmpty().withMessage('Vehicle model is required'),
  body('year').isInt({ min: 2000 }).withMessage('Invalid vehicle year'),
  body('color').trim().notEmpty().withMessage('Vehicle color is required'),
  body('plateNumber').trim().notEmpty().withMessage('Plate number is required'),
  body('capacity').isInt({ min: 1, max: 50 }).withMessage('Invalid capacity'),
  handleValidation
];

const validatePayment = [
  body('method').isIn(['cash', 'telebirr', 'chapa']).withMessage('Invalid payment method'),
  handleValidation
];

const validateRating = [
  body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be between 1 and 5'),
  body('comment').optional().isLength({ max: 500 }).withMessage('Comment must be under 500 characters'),
  handleValidation
];

const validateObjectId = [
  param('id').isMongoId().withMessage('Invalid ID format'),
  handleValidation
];

const validateUpdateProfile = [
  body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty'),
  body('lastName').optional().trim().notEmpty().withMessage('Last name cannot be empty'),
  body('email').optional().isEmail().normalizeEmail().withMessage('Valid email required'),
  body('preferredLanguage').optional().isIn(['en', 'am', 'om', 'so']).withMessage('Invalid language'),
  handleValidation
];

const validateUpdateLocation = [
  body('coordinates').isArray({ min: 2, max: 2 }).withMessage('Coordinates [lng, lat] required'),
  body('coordinates.0').isFloat({ min: -180, max: 180 }).withMessage('Invalid longitude'),
  body('coordinates.1').isFloat({ min: -90, max: 90 }).withMessage('Invalid latitude'),
  handleValidation
];

const validateForgotPassword = [
  body('phoneNumber').matches(/^(\+251|0)?[97]\d{8}$/).withMessage('Valid Ethiopian phone number required'),
  handleValidation
];

const validateVerifyResetOTP = [
  body('phoneNumber').matches(/^(\+251|0)?[97]\d{8}$/).withMessage('Valid Ethiopian phone number required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits'),
  handleValidation
];

const validateResetPassword = [
  body('phoneNumber').matches(/^(\+251|0)?[97]\d{8}$/).withMessage('Valid Ethiopian phone number required'),
  body('otp').isLength({ min: 4, max: 6 }).withMessage('OTP must be 4-6 digits'),
  body('newPassword').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  handleValidation
];

const validateWithdrawal = [
  body('amount').isFloat({ min: 100 }).withMessage('Minimum withdrawal is 100 ETB'),
  body('method').isIn(['telebirr', 'bank']).withMessage('Invalid withdrawal method'),
  handleValidation
];

module.exports = {
  handleValidation,
  validateRegistration,
  validateLogin,
  validateOTP,
  validateEmailOTP,
  validateSendEmailOTP,
  validateRideRequest,
  validateVehicle,
  validatePayment,
  validateRating,
  validateObjectId,
  validateUpdateProfile,
  validateUpdateLocation,
  validateForgotPassword,
  validateVerifyResetOTP,
  validateResetPassword,
  validateWithdrawal
};
