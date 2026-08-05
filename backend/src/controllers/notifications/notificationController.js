const Notification = require('../../models/Notification');
const { markAsRead, markAllAsRead, getUnreadCount } = require('../../services/notificationService');

exports.getNotifications = async (req, res) => {
  try {
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
  } catch (error) {
    res.status(500).json({ error: 'Failed to get notifications' });
  }
};

exports.markRead = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await markAsRead(notificationId, req.user._id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    const unreadCount = await getUnreadCount(req.user._id);
    res.json({ message: 'Marked as read', unreadCount });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notification' });
  }
};

exports.markAllRead = async (req, res) => {
  try {
    await markAllAsRead(req.user._id);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to mark notifications' });
  }
};

exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;

    const notification = await Notification.findOneAndDelete({
      _id: notificationId,
      recipient: req.user._id
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete notification' });
  }
};
