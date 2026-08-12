const nodemailer = require('nodemailer');
const logger = require('../config/logger');

let transporter = null;

const EMAIL_FROM = process.env.EMAIL_FROM || '"DIRS Ride Sharing" <noreply@dirs-et.com>';

const getTransporter = async () => {
  if (transporter) return transporter;

  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_SECURE
  } = process.env;

  if (SMTP_HOST && SMTP_USER) {
    logger.info('Creating real SMTP transporter', { host: SMTP_HOST });
    transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT, 10) || 587,
      secure: SMTP_SECURE === 'true' || parseInt(SMTP_PORT, 10) === 465,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
      }
    });
    return transporter;
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('SMTP email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER and SMTP_PASS in the environment.');
  }

  logger.warn('SMTP not configured - falling back to Ethereal test email (emails are NOT delivered to real inboxes)');
  const previewAccount = await nodemailer.createTestAccount();
  logger.info(`Ethereal account created: ${previewAccount.user}`);

  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: previewAccount.user,
      pass: previewAccount.pass
    }
  });

  return transporter;
};

const sendEmailOTP = async (email, otp) => {
  try {
    const transport = await getTransporter();

    const info = await transport.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: 'Your DIRS Verification Code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 400px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #2563eb;">DIRS Ride Sharing</h2>
          </div>
          <div style="background: #f8fafc; border-radius: 12px; padding: 24px; text-align: center;">
            <p style="font-size: 14px; color: #64748b; margin-bottom: 8px;">Your verification code is</p>
            <p style="font-size: 32px; font-weight: 800; color: #2563eb; letter-spacing: 8px; margin: 16px 0;">${otp}</p>
            <p style="font-size: 12px; color: #94a3b8;">Valid for 5 minutes. Do not share this code.</p>
          </div>
          <p style="font-size: 11px; color: #94a3b8; text-align: center; margin-top: 20px;">
            Dire Dawa Intercity & Ride Sharing System
          </p>
        </div>
      `
    });

    const previewUrl = nodemailer.getTestMessageUrl(info);
    logger.info(`Email OTP sent`, { email: email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), otp, previewUrl: previewUrl || null });

    return { success: true, previewUrl: previewUrl || null, otpCode: otp };
  } catch (error) {
    logger.error('Email sending failed', { error: error.message });
    return { success: false, error: error.message };
  }
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const sendOTP = async (phoneNumber, otp) => {
  logger.info(`SMS OTP sent`, { phone: phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'), otp });
  return { success: true, message: 'OTP logged (use email OTP for registration)' };
};

const sendRideNotification = async (phoneNumber, type, data) => {
  let message = '';

  switch (type) {
    case 'ride_accepted':
      message = `Your ride has been accepted! Driver: ${data.driverName}, Vehicle: ${data.vehicleInfo}, ETA: ${data.eta} min`;
      break;
    case 'driver_arriving':
      message = `Your driver is arriving at pickup location. Please be ready.`;
      break;
    case 'trip_completed':
      message = `Trip completed! Fare: ${data.fare} ETB. Thank you for using DIRS.`;
      break;
    case 'sos_alert':
      message = `SOS ALERT: ${data.userName} has triggered an emergency alert at ${data.location}. Please respond immediately.`;
      break;
    default:
      message = `DIRS Update: ${data.message}`;
  }

  logger.info('Ride notification', { phone: phoneNumber.replace(/(\d{3})\d{4}(\d{3})/, '$1****$2'), type });
  return { success: true, message: 'Notification logged' };
};

const formatEthiopianPhone = (phone) => {
  let cleaned = phone.replace(/\D/g, '');

  if (cleaned.startsWith('251')) {
    return `+${cleaned}`;
  }

  if (cleaned.startsWith('0')) {
    return `+251${cleaned.substring(1)}`;
  }

  return `+251${cleaned}`;
};

module.exports = { generateOTP, sendOTP, sendEmailOTP, sendRideNotification, formatEthiopianPhone };
