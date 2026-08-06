import React, { useState, useEffect } from 'react';
import { FaBell, FaCheckDouble, FaTrash, FaTimes } from 'react-icons/fa';
import { notificationsAPI } from '../services/api';
import './NotificationBell.css';

const NotificationBell = ({ notifications: socketNotifications = [] }) => {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const res = await notificationsAPI.getNotifications();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (socketNotifications && socketNotifications.length > 0) {
      setNotifications((prev) => [...socketNotifications, ...prev]);
    }
  }, [socketNotifications]);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const handleMarkAllRead = async () => {
    try {
      await notificationsAPI.markAllRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error('Error marking all read:', err);
    }
  };

  const handleDelete = async (id) => {
    try {
      await notificationsAPI.deleteNotification(id);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch (err) {
      console.error('Error deleting notification:', err);
    }
  };

  return (
    <div className="notification-bell-wrapper">
      <button className="bell-btn" onClick={() => setOpen(!open)} title="Notifications">
        <FaBell />
        {unreadCount > 0 && <span className="bell-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notification-drawer">
          <div className="drawer-header">
            <h3>Notifications</h3>
            <div className="drawer-actions">
              {unreadCount > 0 && (
                <button className="action-link" onClick={handleMarkAllRead} title="Mark all read">
                  <FaCheckDouble /> Read all
                </button>
              )}
              <button className="close-btn" onClick={() => setOpen(false)}>
                <FaTimes />
              </button>
            </div>
          </div>

          <div className="drawer-body">
            {loading ? (
              <p className="empty-text">Loading notifications...</p>
            ) : notifications.length === 0 ? (
              <p className="empty-text">No notifications yet</p>
            ) : (
              notifications.map((n) => (
                <div key={n._id || Math.random()} className={`notification-item ${!n.isRead ? 'unread' : ''}`}>
                  <div className="notification-content">
                    <h4>{n.title || 'Trip Notification'}</h4>
                    <p>{n.message || n.body}</p>
                    <span className="notification-time">
                      {n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
                    </span>
                  </div>
                  {n._id && (
                    <button className="delete-btn" onClick={() => handleDelete(n._id)}>
                      <FaTrash />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default NotificationBell;
