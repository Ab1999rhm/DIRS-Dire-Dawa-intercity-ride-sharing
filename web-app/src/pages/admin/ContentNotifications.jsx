import React, { useState, useEffect } from 'react';
import {
  FaBell, FaBullhorn, FaTag, FaEnvelope, FaSearch, FaFilter,
  FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaClock,
  FaUsers, FaPaperPlane, FaCalendarAlt, FaEye, FaChartBar,
  FaSms, FaMobileAlt, FaLayerGroup, FaRobot, FaMagic
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
  const [emailCampaigns, setEmailCampaigns] = useState([]);
  const [smsCampaigns, setSMSCampaigns] = useState([]);
  const [inAppContent, setInAppContent] = useState([]);
  const [segments, setSegments] = useState([]);
  const [automationRules, setAutomationRules] = useState([]);
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
      setLoading(true);
      const [pushRes, announcementsRes, promosRes, emailRes, smsRes, inAppRes, segmentsRes, automationRes] = await Promise.all([
        adminAPI.getPushNotifications({}),
        adminAPI.getAnnouncements({}),
        adminAPI.getPromoCodes({}),
        adminAPI.getEmailCampaigns({}),
        adminAPI.getSMSCampaigns({}),
        adminAPI.getInAppContent({}),
        adminAPI.getUserSegments({}),
        adminAPI.getAutomationRules({})
      ]);
      
      setNotifications(pushRes.data.notifications || []);
      setAnnouncements(announcementsRes.data.announcements || []);
      setPromotions(promosRes.data.promoCodes || []);
      setEmailCampaigns(emailRes.data.campaigns || []);
      setSMSCampaigns(smsRes.data.campaigns || []);
      setInAppContent(inAppRes.data.content || []);
      setSegments(segmentsRes.data.segments || []);
      setAutomationRules(automationRes.data.rules || []);
      setLoading(false);
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
      await adminAPI.createPushNotification(notificationData);
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
        <button
          className={`admin-filter-tab ${activeTab === 'sms' ? 'active' : ''}`}
          onClick={() => setActiveTab('sms')}
        >
          <FaSms /> {t('admin.smsCampaigns') || 'SMS Campaigns'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'inapp' ? 'active' : ''}`}
          onClick={() => setActiveTab('inapp')}
        >
          <FaMobileAlt /> {t('admin.inAppContent') || 'In-App Content'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'segments' ? 'active' : ''}`}
          onClick={() => setActiveTab('segments')}
        >
          <FaLayerGroup /> {t('admin.segments') || 'Segments'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'automation' ? 'active' : ''}`}
          onClick={() => setActiveTab('automation')}
        >
          <FaRobot /> {t('admin.automation') || 'Automation'}
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
            <FaEnvelope />
          </div>
          <div>
            <div className="admin-stat-value">{emailCampaigns.length}</div>
            <div className="admin-stat-label">{t('admin.emailCampaigns') || 'Email Campaigns'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(236, 72, 153, 0.08)', color: '#ec4899' }}>
            <FaSms />
          </div>
          <div>
            <div className="admin-stat-value">{smsCampaigns.length}</div>
            <div className="admin-stat-label">{t('admin.smsCampaigns') || 'SMS Campaigns'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(14, 165, 233, 0.08)', color: '#0ea5e9' }}>
            <FaMobileAlt />
          </div>
          <div>
            <div className="admin-stat-value">{inAppContent.filter(c => c.status === 'active').length}</div>
            <div className="admin-stat-label">{t('admin.activeInApp') || 'Active In-App'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(99, 102, 241, 0.08)', color: '#6366f1' }}>
            <FaLayerGroup />
          </div>
          <div>
            <div className="admin-stat-value">{segments.filter(s => s.isActive).length}</div>
            <div className="admin-stat-label">{t('admin.activeSegments') || 'Active Segments'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
            <FaRobot />
          </div>
          <div>
            <div className="admin-stat-value">{automationRules.filter(r => r.isActive).length}</div>
            <div className="admin-stat-label">{t('admin.activeAutomation') || 'Active Automation'}</div>
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
        <>
          <div className="admin-section-title">
            <FaEnvelope /> {t('admin.emailCampaigns') || 'Email Campaigns'}
          </div>
          <div className="admin-activity-list">
            {emailCampaigns.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px' }}>
                <p>No email campaigns yet</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateModal(true)}>
                  <FaPlus /> Create Campaign
                </button>
              </div>
            ) : (
              emailCampaigns.map((campaign) => (
                <div key={campaign._id} className="admin-activity-item">
                  <div className="admin-activity-icon" style={{ background: 'rgba(124, 58, 237, 0.08)', color: getStatusColor(campaign.status) }}>
                    <FaEnvelope />
                  </div>
                  <div className="admin-activity-info">
                    <div className="admin-activity-text">{campaign.name}</div>
                    <div className="admin-activity-time">
                      {campaign.subject} • {campaign.sentCount || 0} sent
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="status-badge" style={{
                      background: campaign.status === 'sent' ? '#dcfce7' :
                               campaign.status === 'scheduled' ? '#fef3c7' : '#f3f4f6',
                      color: campaign.status === 'sent' ? '#15803d' :
                             campaign.status === 'scheduled' ? '#92400e' : '#6b7280'
                    }}>
                      {campaign.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'sms' && (
        <>
          <div className="admin-section-title">
            <FaSms /> {t('admin.smsCampaigns') || 'SMS Campaigns'}
          </div>
          <div className="admin-activity-list">
            {smsCampaigns.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px' }}>
                <p>No SMS campaigns yet</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateModal(true)}>
                  <FaPlus /> Create Campaign
                </button>
              </div>
            ) : (
              smsCampaigns.map((campaign) => (
                <div key={campaign._id} className="admin-activity-item">
                  <div className="admin-activity-icon" style={{ background: 'rgba(236, 72, 153, 0.08)', color: getStatusColor(campaign.status) }}>
                    <FaSms />
                  </div>
                  <div className="admin-activity-info">
                    <div className="admin-activity-text">{campaign.name}</div>
                    <div className="admin-activity-time">
                      {campaign.message?.substring(0, 50)}... • {campaign.sentCount || 0} sent
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="status-badge" style={{
                      background: campaign.status === 'sent' ? '#dcfce7' :
                               campaign.status === 'scheduled' ? '#fef3c7' : '#f3f4f6',
                      color: campaign.status === 'sent' ? '#15803d' :
                             campaign.status === 'scheduled' ? '#92400e' : '#6b7280'
                    }}>
                      {campaign.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'inapp' && (
        <>
          <div className="admin-section-title">
            <FaMobileAlt /> {t('admin.inAppContent') || 'In-App Content'}
          </div>
          <div className="admin-activity-list">
            {inAppContent.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px' }}>
                <p>No in-app content yet</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateModal(true)}>
                  <FaPlus /> Create Content
                </button>
              </div>
            ) : (
              inAppContent.map((content) => (
                <div key={content._id} className="admin-activity-item">
                  <div className="admin-activity-icon" style={{ background: 'rgba(14, 165, 233, 0.08)', color: getStatusColor(content.status) }}>
                    <FaMobileAlt />
                  </div>
                  <div className="admin-activity-info">
                    <div className="admin-activity-text">{content.title}</div>
                    <div className="admin-activity-time">
                      {content.type} • {content.displayLocation} • {content.viewCount || 0} views
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="status-badge" style={{
                      background: content.status === 'active' ? '#dcfce7' : '#f3f4f6',
                      color: content.status === 'active' ? '#15803d' : '#6b7280'
                    }}>
                      {content.status}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'segments' && (
        <>
          <div className="admin-section-title">
            <FaLayerGroup /> {t('admin.segments') || 'User Segments'}
          </div>
          <div className="admin-activity-list">
            {segments.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px' }}>
                <p>No user segments yet</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateModal(true)}>
                  <FaPlus /> Create Segment
                </button>
              </div>
            ) : (
              segments.map((segment) => (
                <div key={segment._id} className="admin-activity-item">
                  <div className="admin-activity-icon" style={{ background: 'rgba(99, 102, 241, 0.08)', color: segment.isActive ? '#6366f1' : '#9ca3af' }}>
                    <FaLayerGroup />
                  </div>
                  <div className="admin-activity-info">
                    <div className="admin-activity-text">{segment.name}</div>
                    <div className="admin-activity-time">
                      {segment.segmentType} • {segment.targetRole} • {segment.estimatedSize || 0} users
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="status-badge" style={{
                      background: segment.isActive ? '#dcfce7' : '#f3f4f6',
                      color: segment.isActive ? '#15803d' : '#6b7280'
                    }}>
                      {segment.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'automation' && (
        <>
          <div className="admin-section-title">
            <FaRobot /> {t('admin.automation') || 'Automation Rules'}
          </div>
          <div className="admin-activity-list">
            {automationRules.length === 0 ? (
              <div className="admin-empty" style={{ padding: '40px 20px' }}>
                <p>No automation rules yet</p>
                <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={() => setShowCreateModal(true)}>
                  <FaPlus /> Create Rule
                </button>
              </div>
            ) : (
              automationRules.map((rule) => (
                <div key={rule._id} className="admin-activity-item">
                  <div className="admin-activity-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: rule.isActive ? '#22c55e' : '#9ca3af' }}>
                    <FaRobot />
                  </div>
                  <div className="admin-activity-info">
                    <div className="admin-activity-text">{rule.name}</div>
                    <div className="admin-activity-time">
                      {rule.triggerType} → {rule.actionType} • {rule.executionCount || 0} runs
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div className="status-badge" style={{
                      background: rule.isActive ? '#dcfce7' : '#f3f4f6',
                      color: rule.isActive ? '#15803d' : '#6b7280'
                    }}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {activeTab === 'push' ? t('admin.sendNotification') || 'Send Notification' :
                 activeTab === 'announcements' ? t('admin.createAnnouncement') || 'Create Announcement' :
                 activeTab === 'promotions' ? t('admin.createPromotion') || 'Create Promotion' :
                 activeTab === 'email' ? t('admin.createEmailCampaign') || 'Create Email Campaign' :
                 activeTab === 'sms' ? t('admin.createSMSCampaign') || 'Create SMS Campaign' :
                 activeTab === 'inapp' ? t('admin.createInAppContent') || 'Create In-App Content' :
                 activeTab === 'segments' ? t('admin.createSegment') || 'Create Segment' :
                 t('admin.createAutomationRule') || 'Create Automation Rule'}
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
