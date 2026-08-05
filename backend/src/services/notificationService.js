const Notification = require('../models/Notification');
const { sendSMS } = require('./smsService');
const logger = require('../config/logger');

const createNotification = async (recipientId, type, title, message, data = {}, channel = 'in_app') => {
  try {
    const notification = await Notification.create({
      recipient: recipientId,
      type,
      title,
      message,
      data,
      channel
    });

    return notification;
  } catch (error) {
    logger.error('Create notification error', { error: error.message });
    return null;
  }
};

const sendPushNotification = async (userId, title, body, data = {}) => {
  try {
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
    sos_alert: 'Emergency Alert'
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
    sos_alert: 'Emergency SOS alert has been triggered'
  };

  const notification = await createNotification(
    recipientId, type,
    titles[type] || 'DIRS Update',
    messages[type] || 'Update available',
    rideData
  );

  await sendPushNotification(recipientId, titles[type], messages[type], rideData);

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
