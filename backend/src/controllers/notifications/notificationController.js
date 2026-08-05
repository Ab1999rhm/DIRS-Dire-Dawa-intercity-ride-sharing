const Notification = require('../../models/Notification');
const { markAsRead, markAllAsRead, getUnreadCount } = require('../../services/notificationService');
const { asyncHandler } = require('../../middleware/errorHandler');

exports.getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, unreadOnly } = req.query;

  const query = { recipient: req.user._id };
  if (unreadOnly === 'true') {
    query.isRead = false;
  }

  const notifications = await Notification.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(parseInt(limit));

  const total = await Notification.countDocuments(query);
  const unreadCount = await getUnreadCount(req.user._id);

  res.json({ notifications, total, unreadCount, page: parseInt(page), pages: Math.ceil(total / limit) });
});

exports.markRead = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await markAsRead(notificationId, req.user._id);
  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  const unreadCount = await getUnreadCount(req.user._id);
  res.json({ message: 'Marked as read', unreadCount });
});

exports.markAllRead = asyncHandler(async (req, res) => {
  await markAllAsRead(req.user._id);
  res.json({ message: 'All notifications marked as read' });
});

exports.deleteNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await Notification.findOneAndDelete({
    _id: notificationId,
    recipient: req.user._id
  });

  if (!notification) {
    return res.status(404).json({ error: 'Notification not found' });
  }

  res.json({ message: 'Notification deleted' });
});
