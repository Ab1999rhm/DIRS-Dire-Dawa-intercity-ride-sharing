import React, { useState, useEffect } from 'react';
import {
  FaBell, FaBullhorn, FaTag, FaEnvelope, FaSearch, FaFilter,
  FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaClock,
  FaUsers, FaPaperPlane, FaCalendarAlt, FaEye, FaChartBar
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const ContentNotifications = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [promotions, setPromotions] = useState([]);
  const [activeTab, setActiveTab] = useState('push');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    scheduledFor: ''
  });

  useEffect(() => {
    fetchContentData();
  }, []);

  const fetchContentData = async () => {
    try {
      setLoading(false);
      // Placeholder data - in real implementation, fetch from API
      setNotifications([
        { id: 1, title: 'New Feature Alert', message: 'Check out our new ride scheduling feature!', status: 'sent', sentAt: '2024-01-15', target: 'all' },
        { id: 2, title: 'Promotion Reminder', message: 'Use code DIRS20 for 20% off!', status: 'scheduled', sentAt: '2024-01-20', target: 'passengers' }
      ]);
      setAnnouncements([
        { id: 1, title: 'System Maintenance', message: 'Scheduled maintenance on Jan 20', status: 'active', createdAt: '2024-01-15' }
      ]);
      setPromotions([
        { id: 1, title: 'Weekend Special', code: 'WEEKEND20', discount: '20%', status: 'active', validUntil: '2024-01-31' }
      ]);
    } catch (err) {
      console.error('Failed to fetch content data:', err);
      setLoading(false);
    }
  };

  const handleSendNotification = async () => {
    if (!notificationData.title || !notificationData.message) {
      toast.error('Please fill in all required fields');
      return;
    }
    try {
      await adminAPI.sendPushNotification(notificationData);
      toast.success('Notification sent successfully');
      setShowCreateModal(false);
      setNotificationData({ title: '', message: '', targetAudience: 'all', scheduledFor: '' });
      fetchContentData();
    } catch (err) {
      toast.error('Failed to send notification');
    }
  };

  const handleCreateAnnouncement = async () => {
    try {
      await adminAPI.createAnnouncement(notificationData);
      toast.success('Announcement created successfully');
      setShowCreateModal(false);
      setNotificationData({ title: '', message: '', targetAudience: 'all', scheduledFor: '' });
      fetchContentData();
    } catch (err) {
      toast.error('Failed to create announcement');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'sent': return '#10b981';
      case 'scheduled': return '#f59e0b';
      case 'active': return '#10b981';
      case 'expired': return '#ef4444';
      case 'draft': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 100 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
        <div className="admin-skeleton" style={{ height: 300 }}></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-greeting">
            {t('admin.contentNotifications') || 'Content & Notifications'}
          </div>
          <div className="admin-role-badge">
            <FaBell /> {t('admin.notifications') || 'Notifications'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchContentData}>
            <FaSearch />
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowCreateModal(true)}
          >
            <FaPlus /> {t('admin.create') || 'Create'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-filter-tabs">
        <button
          className={`admin-filter-tab ${activeTab === 'push' ? 'active' : ''}`}
          onClick={() => setActiveTab('push')}
        >
          <FaBell /> {t('admin.pushNotifications') || 'Push Notifications'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'announcements' ? 'active' : ''}`}
          onClick={() => setActiveTab('announcements')}
        >
          <FaBullhorn /> {t('admin.announcements') || 'Announcements'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'promotions' ? 'active' : ''}`}
          onClick={() => setActiveTab('promotions')}
        >
          <FaTag /> {t('admin.promotions') || 'Promotions'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'email' ? 'active' : ''}`}
          onClick={() => setActiveTab('email')}
        >
          <FaEnvelope /> {t('admin.emailCampaigns') || 'Email Campaigns'}
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <FaBell />
          </div>
          <div>
            <div className="admin-stat-value">{notifications.length}</div>
            <div className="admin-stat-label">{t('admin.notificationsSent') || 'Notifications Sent'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
            <FaBullhorn />
          </div>
          <div>
            <div className="admin-stat-value">{announcements.filter(a => a.status === 'active').length}</div>
            <div className="admin-stat-label">{t('admin.activeAnnouncements') || 'Active Announcements'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <FaTag />
          </div>
          <div>
            <div className="admin-stat-value">{promotions.filter(p => p.status === 'active').length}</div>
            <div className="admin-stat-label">{t('admin.activePromotions') || 'Active Promotions'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(124, 58, 237, 0.08)', color: '#7c3aed' }}>
            <FaUsers />
          </div>
          <div>
            <div className="admin-stat-value">12.5K</div>
            <div className="admin-stat-label">{t('admin.totalReach') || 'Total Reach'}</div>
          </div>
        </div>
      </div>

      {activeTab === 'push' && (
        <>
          <div className="admin-section-title">
            <FaBell /> {t('admin.pushNotifications') || 'Push Notifications'}
          </div>
          <div className="admin-activity-list">
            {notifications.map((notification) => (
              <div key={notification.id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  color: getStatusColor(notification.status)
                }}>
                  <FaBell />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{notification.title}</div>
                  <div className="admin-activity-time">
                    {notification.message} • {notification.target}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="status-badge" style={{
                    background: notification.status === 'sent' ? '#dcfce7' :
                             notification.status === 'scheduled' ? '#fef3c7' : '#f3f4f6',
                    color: notification.status === 'sent' ? '#15803d' :
                           notification.status === 'scheduled' ? '#92400e' : '#6b7280'
                  }}>
                    {notification.status}
                  </div>
                  <button className="admin-icon-btn" style={{ width: 32, height: 32 }}>
                    <FaEye />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'announcements' && (
        <>
          <div className="admin-section-title">
            <FaBullhorn /> {t('admin.announcements') || 'Announcements'}
          </div>
          <div className="admin-activity-list">
            {announcements.map((announcement) => (
              <div key={announcement.id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{
                  background: 'rgba(16, 185, 129, 0.08)',
                  color: getStatusColor(announcement.status)
                }}>
                  <FaBullhorn />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{announcement.title}</div>
                  <div className="admin-activity-time">
                    {announcement.message} • {new Date(announcement.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="admin-icon-btn" style={{ width: 32, height: 32 }}>
                    <FaEdit />
                  </button>
                  <button className="admin-icon-btn" style={{ width: 32, height: 32 }}>
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'promotions' && (
        <>
          <div className="admin-section-title">
            <FaTag /> {t('admin.promotions') || 'Promotions'}
          </div>
          <div className="admin-activity-list">
            {promotions.map((promotion) => (
              <div key={promotion.id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{
                  background: 'rgba(245, 158, 11, 0.08)',
                  color: getStatusColor(promotion.status)
                }}>
                  <FaTag />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{promotion.title}</div>
                  <div className="admin-activity-time">
                    Code: {promotion.code} • {promotion.discount} off
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="status-badge" style={{
                    background: promotion.status === 'active' ? '#dcfce7' : '#f3f4f6',
                    color: promotion.status === 'active' ? '#15803d' : '#6b7280'
                  }}>
                    {promotion.status}
                  </div>
                  <button className="admin-icon-btn" style={{ width: 32, height: 32 }}>
                    <FaEdit />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'email' && (
        <div className="admin-empty" style={{ padding: '60px 20px' }}>
          <div className="admin-empty-icon">
            <FaEnvelope />
          </div>
          <h3>{t('admin.emailCampaigns') || 'Email Campaigns'}</h3>
          <p>{t('admin.emailCampaignsDescription') || 'Create and manage email marketing campaigns'}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }}>
            <FaPlus /> {t('admin.createCampaign') || 'Create Campaign'}
          </button>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {activeTab === 'push' ? t('admin.sendNotification') || 'Send Notification' :
                 activeTab === 'announcements' ? t('admin.createAnnouncement') || 'Create Announcement' :
                 t('admin.createPromotion') || 'Create Promotion'}
              </h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.title') || 'Title'}
                </label>
                <input
                  type="text"
                  value={notificationData.title}
                  onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })}
                  placeholder={t('admin.enterTitle') || 'Enter title...'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.message') || 'Message'}
                </label>
                <textarea
                  value={notificationData.message}
                  onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })}
                  placeholder={t('admin.enterMessage') || 'Enter message...'}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px',
                    minHeight: '100px',
                    resize: 'vertical'
                  }}
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.targetAudience') || 'Target Audience'}
                </label>
                <select
                  value={notificationData.targetAudience}
                  onChange={(e) => setNotificationData({ ...notificationData, targetAudience: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                >
                  <option value="all">{t('admin.allUsers') || 'All Users'}</option>
                  <option value="passengers">{t('admin.passengers') || 'Passengers'}</option>
                  <option value="drivers">{t('admin.drivers') || 'Drivers'}</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.scheduleFor') || 'Schedule For (Optional)'}
                </label>
                <input
                  type="datetime-local"
                  value={notificationData.scheduledFor}
                  onChange={(e) => setNotificationData({ ...notificationData, scheduledFor: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '2px solid var(--border-light)',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={activeTab === 'push' ? handleSendNotification : handleCreateAnnouncement}
              >
                <FaPaperPlane /> {activeTab === 'push' ? t('admin.send') || 'Send' : t('admin.create') || 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentNotifications;
