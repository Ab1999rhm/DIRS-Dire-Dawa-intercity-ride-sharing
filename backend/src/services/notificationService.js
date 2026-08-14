const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendSMS } = require('./smsService');
const logger = require('../config/logger');

/**
 * Map a notification type to the user preference that controls it.
 * Types not listed here are considered critical/system and always send.
 * Returns null when the notification is not user-gated.
 */
const PREFERENCE_BY_TYPE = {
  rideUpdates: ['ride_request', 'ride_accepted', 'ride_cancelled', 'driver_arriving', 'driver_arrived', 'trip_started', 'trip_completed', 'payment_received', 'payment_failed', 'rating_received', 'trip_cancelled', 'trip_assigned', 'driver_reassigned', 'no_show', 'refund_processed', 'compensation_issued', 'wallet_topup_confirmed'],
  promotions: ['announcement', 'broadcast', 'promo', 'promotion', 'offer'],
  safetyAlerts: ['sos_alert', 'sos_resolved', 'incident_assigned', 'account_blocked', 'account_unblocked', 'account_suspended', 'account_banned', 'warning']
};

const PREFERENCE_LOOKUP = Object.entries(PREFERENCE_BY_TYPE).reduce((acc, [pref, types]) => {
  types.forEach(type => { acc[type] = pref; });
  return acc;
}, {});

const getPreferenceForType = (type) => PREFERENCE_LOOKUP[type] || null;

/**
 * Returns true if a notification should be delivered to the recipient
 * based on their saved notification preferences.
 */
const shouldNotify = async (recipientId, type) => {
  const prefKey = getPreferenceForType(type);
  if (!prefKey) return true;
  try {
    const user = await User.findById(recipientId).select('preferences');
    if (!user) return true;
    const prefs = user.preferences || {};
    return prefs[prefKey] !== false;
  } catch (error) {
    logger.error('Preference gate check failed', { error: error.message, recipientId, type });
    return true;
  }
};

const createNotification = async (recipientId, type, title, message, data = {}, channel = 'in_app') => {
  try {
    const allowed = await shouldNotify(recipientId, type);
    if (!allowed) {
      logger.info('Notification skipped by user preference', { recipientId, type });
      return null;
    }
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      data,
      channel
    });

    // Live-push to the recipient's room so ALL notifications (not just ride
    // updates) appear immediately in the UI, along with the updated unread count.
    try {
      const io = require('../sockets/socketManager').getIO();
      if (io) {
        const unreadCount = await Notification.countDocuments({ recipient: recipientId, isRead: false });
        io.to(`user_${recipientId}`).emit('notification', {
          notification,
          unreadCount
        });
        io.to(`user_${recipientId}`).emit('notification_count', { unreadCount });
      }
    } catch (pushError) {
      logger.warn('Live notification push failed', { error: pushError.message });
    }

    return notification;
  } catch (error) {
    logger.error('Create notification error', { error: error.message });
    return null;
  }
};

const sendPushNotification = async (userId, title, body, data = {}, type = null) => {
  try {
    const allowed = type ? await shouldNotify(userId, type) : true;
    if (!allowed) {
      logger.info('Push notification skipped by user preference', { userId, type });
      return { success: true, skipped: true };
    }
    const io = require('../sockets/socketManager').getIO();
    if (io) {
      io.to(`user_${userId}`).emit('notification', {
        type: 'push',
        title,
        body,
        data
      });
    }
    return { success: true };
  } catch (error) {
    logger.error('Push notification error', { error: error.message });
    return { success: false, error: error.message };
  }
};

const notifyRideUpdate = async (recipientId, type, rideData) => {
  const titles = {
    ride_request: 'New Ride Request',
    ride_accepted: 'Ride Accepted',
    ride_cancelled: 'Ride Cancelled',
    driver_arriving: 'Driver is Arriving',
    trip_started: 'Trip Started',
    trip_completed: 'Trip Completed',
    payment_received: 'Payment Received',
    payment_failed: 'Payment Failed',
    rating_received: 'New Rating',
    sos_alert: 'Emergency Alert',
    withdrawal_requested: 'Withdrawal Requested',
    withdrawal_approved: 'Withdrawal Approved',
    withdrawal_completed: 'Withdrawal Completed',
    withdrawal_failed: 'Withdrawal Failed'
  };

  const messages = {
    ride_request: `New ride request from ${rideData.passengerName || 'Passenger'}`,
    ride_accepted: `Driver ${rideData.driverName} accepted your ride`,
    ride_cancelled: `Ride has been cancelled`,
    driver_arriving: `Your driver is approaching the pickup location`,
    trip_started: 'Your trip has started',
    trip_completed: `Trip completed. Fare: ${rideData.fare || 'N/A'} ETB`,
    payment_received: `Payment of ${rideData.amount || 'N/A'} ETB received`,
    payment_failed: 'Payment processing failed. Please try again.',
    rating_received: `You received a ${rideData.rating}-star rating`,
    sos_alert: 'Emergency SOS alert has been triggered',
    withdrawal_requested: `Your withdrawal of ${rideData.amount || 'N/A'} ETB is awaiting admin approval`,
    withdrawal_approved: `Your withdrawal of ${rideData.amount || 'N/A'} ETB was approved and is being processed`,
    withdrawal_completed: `Your withdrawal of ${rideData.amount || 'N/A'} ETB was sent successfully`,
    withdrawal_failed: `Your withdrawal of ${rideData.amount || 'N/A'} ETB failed${rideData.reason ? `: ${rideData.reason}` : ''}`
  };

  const notification = await createNotification(
    recipientId, type,
    titles[type] || 'DIRS Update',
    messages[type] || 'Update available',
    rideData
  );

  return notification;
};

const getUnreadCount = async (userId) => {
  return await Notification.countDocuments({ recipient: userId, isRead: false });
};

const markAsRead = async (notificationId, userId) => {
  return await Notification.findOneAndUpdate(
    { _id: notificationId, recipient: userId },
    { isRead: true, readAt: new Date() },
    { new: true }
  );
};

const markAllAsRead = async (userId) => {
  return await Notification.updateMany(
    { recipient: userId, isRead: false },
    { isRead: true, readAt: new Date() }
  );
};

module.exports = {
  createNotification,
  sendPushNotification,
  notifyRideUpdate,
  getUnreadCount,
  markAsRead,
  markAllAsRead
};
