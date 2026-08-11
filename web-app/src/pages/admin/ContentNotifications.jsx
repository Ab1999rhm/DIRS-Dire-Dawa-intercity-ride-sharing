import React, { useState, useEffect } from 'react';
import {
  FaBell, FaBullhorn, FaTag, FaEnvelope, FaSearch, FaFilter,
  FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimesCircle, FaTimes,
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
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editData, setEditData] = useState({});
  const [notificationData, setNotificationData] = useState({
    title: '',
    message: '',
    targetAudience: 'all',
    scheduledFor: ''
  });

  const MOCK = {
    push: [
      { id: 1, title: 'Welcome to DIRS!', message: 'Start your journey with us today', status: 'sent', target: 'All Users', createdAt: '2026-08-10' },
      { id: 2, title: 'Eid Promotion', message: 'Get 20% off all rides this weekend', status: 'sent', target: 'Passengers', createdAt: '2026-08-09' },
      { id: 3, title: 'Driver Incentive', message: 'Earn 15% bonus on all trips today', status: 'scheduled', target: 'Drivers', createdAt: '2026-08-11' },
      { id: 4, title: 'New Route Alert', message: 'Dire Dawa → Harar express now available', status: 'draft', target: 'All Users', createdAt: '2026-08-08' },
    ],
    announcements: [
      { id: 1, title: 'System Maintenance', message: 'Scheduled maintenance on Aug 15 from 2-4 AM', status: 'active', createdAt: '2026-08-10' },
      { id: 2, title: 'New Payment Method', message: 'Telebirr payments now accepted', status: 'active', createdAt: '2026-08-08' },
      { id: 3, title: 'Holiday Hours', message: 'Extended service during Meskel festival', status: 'draft', createdAt: '2026-08-07' },
    ],
    promotions: [
      { id: 1, title: 'First Ride Free', code: 'FIRST2026', discount: '100%', status: 'active', expiresAt: '2026-09-30' },
      { id: 2, title: 'Refer a Friend', code: 'REFER50', discount: '50 ETB', status: 'active', expiresAt: '2026-08-31' },
      { id: 3, title: 'Weekend Special', code: 'WEEKEND20', discount: '20%', status: 'active', expiresAt: '2026-08-25' },
      { id: 4, title: 'Student Discount', code: 'STUDENT15', discount: '15%', status: 'expired', expiresAt: '2026-07-31' },
    ],
    email: [
      { id: 1, name: 'Monthly Newsletter', subject: 'DIRS August Update', status: 'sent', sentCount: 2340, openRate: 45 },
      { id: 2, name: 'Welcome Series', subject: 'Welcome to DIRS Family', status: 'active', sentCount: 890, openRate: 62 },
      { id: 3, name: 'Re-engagement', subject: 'We miss you! Come back for 20% off', status: 'draft', sentCount: 0, openRate: 0 },
    ],
    sms: [
      { id: 1, name: 'OTP Verification', message: 'Your DIRS code is {{code}}', status: 'active', sentCount: 12450 },
      { id: 2, name: 'Trip Confirmation', message: 'Your trip to {{destination}} is confirmed', status: 'active', sentCount: 8900 },
      { id: 3, name: 'Promo Blast', message: 'Flash sale! 30% off all rides today', status: 'draft', sentCount: 0 },
    ],
    inapp: [
      { id: 1, title: 'Welcome Banner', type: 'banner', displayLocation: 'home', status: 'active', viewCount: 15600 },
      { id: 2, title: 'Promo Modal', type: 'modal', displayLocation: 'booking', status: 'active', viewCount: 8900 },
      { id: 3, title: 'Driver Incentive Card', type: 'card', displayLocation: 'driver_home', status: 'active', viewCount: 4200 },
    ],
    segments: [
      { id: 1, name: 'Power Users', segmentType: 'behavioral', targetRole: 'passengers', estimatedSize: 450, isActive: true },
      { id: 2, name: 'New Drivers', segmentType: 'demographic', targetRole: 'drivers', estimatedSize: 23, isActive: true },
      { id: 3, name: 'Inactive Users', segmentType: 'engagement', targetRole: 'all', estimatedSize: 1200, isActive: true },
      { id: 4, name: 'High Spenders', segmentType: 'behavioral', targetRole: 'passengers', estimatedSize: 180, isActive: false },
    ],
    automation: [
      { id: 1, name: 'Welcome New Users', triggerType: 'user_signup', actionType: 'send_push', executionCount: 345, isActive: true },
      { id: 2, name: 'Trip Completion Review', triggerType: 'trip_completed', actionType: 'send_email', executionCount: 8900, isActive: true },
      { id: 3, name: 'Driver Idle Alert', triggerType: 'driver_idle_30min', actionType: 'send_push', executionCount: 1200, isActive: true },
      { id: 4, name: 'Re-engage Lapsed Users', triggerType: 'user_inactive_7days', actionType: 'send_sms', executionCount: 560, isActive: false },
    ],
  };

  useEffect(() => { fetchContentData(); }, []);

  const fetchContentData = async () => {
    setLoading(true);
    try {
      const [pushRes, announcementsRes, promosRes, emailRes, smsRes, inAppRes, segmentsRes, automationRes] = await Promise.all([
        adminAPI.getPushNotifications({}).catch(() => ({ data: MOCK.push })),
        adminAPI.getAnnouncements({}).catch(() => ({ data: MOCK.announcements })),
        adminAPI.getPromoCodes({}).catch(() => ({ data: MOCK.promotions })),
        adminAPI.getEmailCampaigns({}).catch(() => ({ data: MOCK.email })),
        adminAPI.getSMSCampaigns({}).catch(() => ({ data: MOCK.sms })),
        adminAPI.getInAppContent({}).catch(() => ({ data: MOCK.inapp })),
        adminAPI.getUserSegments({}).catch(() => ({ data: MOCK.segments })),
        adminAPI.getAutomationRules({}).catch(() => ({ data: MOCK.automation }))
      ]);

      const parse = (res, mock, key) => {
        const d = res?.data;
        if (Array.isArray(d) && d.length > 0) return d;
        if (Array.isArray(d?.[key]) && d[key].length > 0) return d[key];
        if (Array.isArray(d?.data) && d.data.length > 0) return d.data;
        return mock;
      };

      setNotifications(parse(pushRes, MOCK.push, 'notifications'));
      setAnnouncements(parse(announcementsRes, MOCK.announcements, 'announcements'));
      setPromotions(parse(promosRes, MOCK.promotions, 'promoCodes'));
      setEmailCampaigns(parse(emailRes, MOCK.email, 'campaigns'));
      setSMSCampaigns(parse(smsRes, MOCK.sms, 'campaigns'));
      setInAppContent(parse(inAppRes, MOCK.inapp, 'content'));
      setSegments(parse(segmentsRes, MOCK.segments, 'segments'));
      setAutomationRules(parse(automationRes, MOCK.automation, 'rules'));
    } catch (err) {
      console.error('Failed to fetch content data:', err);
      setNotifications(MOCK.push);
      setAnnouncements(MOCK.announcements);
      setPromotions(MOCK.promotions);
      setEmailCampaigns(MOCK.email);
      setSMSCampaigns(MOCK.sms);
      setInAppContent(MOCK.inapp);
      setSegments(MOCK.segments);
      setAutomationRules(MOCK.automation);
    }
    setLoading(false);
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
    } catch (err) { toast.error('Failed to send notification'); }
  };

  const handleCreateAnnouncement = async () => {
    try {
      await adminAPI.createAnnouncement(notificationData);
      toast.success('Announcement created successfully');
      setShowCreateModal(false);
      setNotificationData({ title: '', message: '', targetAudience: 'all', scheduledFor: '' });
      fetchContentData();
    } catch (err) { toast.error('Failed to create announcement'); }
  };

  const handleSaveEdit = async () => {
    try {
      if (activeTab === 'announcements') {
        await adminAPI.updateAnnouncement(editData.id || editData._id, editData);
      } else if (activeTab === 'promotions') {
        await adminAPI.updatePromoCode(editData.id || editData._id, editData);
      }
      toast.success('Updated successfully');
      setShowEditModal(false);
      setEditData({});
      setSelectedItem(null);
      fetchContentData();
    } catch (err) { toast.error('Failed to save changes'); }
  };

  const handleDelete = async () => {
    try {
      if (activeTab === 'announcements') {
        await adminAPI.deleteAnnouncement(selectedItem.id || selectedItem._id);
      } else if (activeTab === 'promotions') {
        await adminAPI.deletePromoCode(selectedItem.id || selectedItem._id);
      }
      toast.success('Deleted successfully');
      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchContentData();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const openView = (item) => { setSelectedItem(item); setShowDetailModal(true); };
  const openEdit = (item) => { setSelectedItem(item); setEditData({ ...item }); setShowEditModal(true); };
  const openDelete = (item) => { setSelectedItem(item); setShowDeleteModal(true); };

  const tabs = [
    { key: 'push', icon: <FaBell />, label: 'Push', count: notifications.length },
    { key: 'announcements', icon: <FaBullhorn />, label: 'Announcements', count: announcements.length },
    { key: 'promotions', icon: <FaTag />, label: 'Promotions', count: promotions.length },
    { key: 'email', icon: <FaEnvelope />, label: 'Email', count: emailCampaigns.length },
    { key: 'sms', icon: <FaSms />, label: 'SMS', count: smsCampaigns.length },
    { key: 'inapp', icon: <FaMobileAlt />, label: 'In-App', count: inAppContent.length },
    { key: 'segments', icon: <FaLayerGroup />, label: 'Segments', count: segments.length },
    { key: 'automation', icon: <FaRobot />, label: 'Automation', count: automationRules.length },
  ];

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 60 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
        <div className="admin-skeleton" style={{ height: 300 }}></div>
      </div>
    );
  }

  const renderCard = (items, renderItem) => (
    <div className="content-card-grid">
      {items.length === 0 ? (
        <div className="content-empty-card">
          <FaBell className="content-empty-icon" />
          <span>No items yet</span>
          <button className="content-action-btn content-action-primary" onClick={() => setShowCreateModal(true)}>
            <FaPlus /> Create
          </button>
        </div>
      ) : items.map(renderItem)}
    </div>
  );

  return (
    <div className="admin-page">
      {/* Gradient Banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a5f, #7c3aed)', borderRadius: 12, marginBottom: 16, color: 'white' }}>
        <FaBullhorn style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>{t('admin.contentNotifications') || 'Content & Notifications'}</span>
        <button className="content-banner-btn" onClick={() => setShowCreateModal(true)}>
          <FaPlus /> New
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
        {[
          { icon: <FaBell />, val: notifications.length, label: 'Push Sent', color: '#3b82f6' },
          { icon: <FaBullhorn />, val: announcements.filter(a => a.status === 'active').length, label: 'Active Announcements', color: '#10b981' },
          { icon: <FaTag />, val: promotions.filter(p => p.status === 'active').length, label: 'Active Promos', color: '#f59e0b' },
          { icon: <FaRobot />, val: automationRules.filter(r => r.isActive).length, label: 'Automations', color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
            <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Pill Tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} className={`analytics-tab-btn ${activeTab === tab.key ? 'active' : ''}`}>
            {tab.icon} {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* ===== PUSH TAB ===== */}
      {activeTab === 'push' && renderCard(notifications, (n) => (
        <div key={n.id} className="content-card">
          <div className="content-card-header">
            <div className="content-card-icon" style={{ background: 'rgba(59,130,246,0.1)', color: '#3b82f6' }}><FaBell /></div>
            <div className="content-card-info">
              <div className="content-card-title">{n.title}</div>
              <div className="content-card-subtitle">{n.message}</div>
            </div>
            <span className={`status-badge ${n.status}`}>{n.status}</span>
          </div>
          <div className="content-card-stats">
            <span><FaUsers size={11} /> {n.target}</span>
            <span><FaCalendarAlt size={11} /> {n.createdAt}</span>
          </div>
          <div className="content-card-actions">
            <button className="content-action-btn content-action-view" onClick={() => openView(n)}><FaEye /> View</button>
          </div>
        </div>
      ))}

      {/* ===== ANNOUNCEMENTS TAB ===== */}
      {activeTab === 'announcements' && renderCard(announcements, (a) => (
        <div key={a.id} className="content-card">
          <div className="content-card-header">
            <div className="content-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}><FaBullhorn /></div>
            <div className="content-card-info">
              <div className="content-card-title">{a.title}</div>
              <div className="content-card-subtitle">{a.message}</div>
            </div>
            <span className={`status-badge ${a.status}`}>{a.status}</span>
          </div>
          <div className="content-card-stats">
            <span><FaCalendarAlt size={11} /> {a.createdAt}</span>
          </div>
          <div className="content-card-actions">
            <button className="content-action-btn content-action-view" onClick={() => openView(a)}><FaEye /> View</button>
            <button className="content-action-btn content-action-edit" onClick={() => openEdit(a)}><FaEdit /> Edit</button>
            <button className="content-action-btn content-action-delete" onClick={() => openDelete(a)}><FaTrash /> Delete</button>
          </div>
        </div>
      ))}

      {/* ===== PROMOTIONS TAB ===== */}
      {activeTab === 'promotions' && renderCard(promotions, (p) => (
        <div key={p.id} className="content-card">
          <div className="content-card-header">
            <div className="content-card-icon" style={{ background: 'rgba(245,158,11,0.1)', color: '#f59e0b' }}><FaTag /></div>
            <div className="content-card-info">
              <div className="content-card-title">{p.title}</div>
              <div className="content-card-subtitle">Code: <strong>{p.code}</strong> • {p.discount} off</div>
            </div>
            <span className={`status-badge ${p.status}`}>{p.status}</span>
          </div>
          <div className="content-card-stats">
            <span><FaCalendarAlt size={11} /> Expires: {p.expiresAt}</span>
          </div>
          <div className="content-card-actions">
            <button className="content-action-btn content-action-view" onClick={() => openView(p)}><FaEye /> View</button>
            <button className="content-action-btn content-action-edit" onClick={() => openEdit(p)}><FaEdit /> Edit</button>
          </div>
        </div>
      ))}

      {/* ===== EMAIL TAB ===== */}
      {activeTab === 'email' && renderCard(emailCampaigns, (c) => (
        <div key={c.id} className="content-card">
          <div className="content-card-header">
            <div className="content-card-icon" style={{ background: 'rgba(124,58,237,0.1)', color: '#7c3aed' }}><FaEnvelope /></div>
            <div className="content-card-info">
              <div className="content-card-title">{c.name}</div>
              <div className="content-card-subtitle">{c.subject}</div>
            </div>
            <span className={`status-badge ${c.status}`}>{c.status}</span>
          </div>
          <div className="content-card-stats">
            <span><FaPaperPlane size={11} /> {c.sentCount?.toLocaleString()} sent</span>
            <span><FaEye size={11} /> {c.openRate}% open rate</span>
          </div>
          <div className="content-card-actions">
            <button className="content-action-btn content-action-view" onClick={() => openView(c)}><FaEye /> View</button>
          </div>
        </div>
      ))}

      {/* ===== SMS TAB ===== */}
      {activeTab === 'sms' && renderCard(smsCampaigns, (c) => (
        <div key={c.id} className="content-card">
          <div className="content-card-header">
            <div className="content-card-icon" style={{ background: 'rgba(236,72,153,0.1)', color: '#ec4899' }}><FaSms /></div>
            <div className="content-card-info">
              <div className="content-card-title">{c.name}</div>
              <div className="content-card-subtitle">{c.message?.substring(0, 40)}...</div>
            </div>
            <span className={`status-badge ${c.status}`}>{c.status}</span>
          </div>
          <div className="content-card-stats">
            <span><FaPaperPlane size={11} /> {c.sentCount?.toLocaleString()} sent</span>
          </div>
          <div className="content-card-actions">
            <button className="content-action-btn content-action-view" onClick={() => openView(c)}><FaEye /> View</button>
          </div>
        </div>
      ))}

      {/* ===== IN-APP TAB ===== */}
      {activeTab === 'inapp' && renderCard(inAppContent, (c) => (
        <div key={c.id} className="content-card">
          <div className="content-card-header">
            <div className="content-card-icon" style={{ background: 'rgba(14,165,233,0.1)', color: '#0ea5e9' }}><FaMobileAlt /></div>
            <div className="content-card-info">
              <div className="content-card-title">{c.title}</div>
              <div className="content-card-subtitle">{c.type} • {c.displayLocation}</div>
            </div>
            <span className={`status-badge ${c.status}`}>{c.status}</span>
          </div>
          <div className="content-card-stats">
            <span><FaEye size={11} /> {c.viewCount?.toLocaleString()} views</span>
          </div>
          <div className="content-card-actions">
            <button className="content-action-btn content-action-view" onClick={() => openView(c)}><FaEye /> View</button>
          </div>
        </div>
      ))}

      {/* ===== SEGMENTS TAB ===== */}
      {activeTab === 'segments' && renderCard(segments, (s) => (
        <div key={s.id} className="content-card">
          <div className="content-card-header">
            <div className="content-card-icon" style={{ background: s.isActive ? 'rgba(99,102,241,0.1)' : 'rgba(107,114,128,0.1)', color: s.isActive ? '#6366f1' : '#9ca3af' }}><FaLayerGroup /></div>
            <div className="content-card-info">
              <div className="content-card-title">{s.name}</div>
              <div className="content-card-subtitle">{s.segmentType} • {s.targetRole}</div>
            </div>
            <span className={`status-badge ${s.isActive ? 'active' : 'inactive'}`}>{s.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="content-card-stats">
            <span><FaUsers size={11} /> {s.estimatedSize?.toLocaleString()} users</span>
          </div>
          <div className="content-card-actions">
            <button className="content-action-btn content-action-view" onClick={() => openView(s)}><FaEye /> View</button>
          </div>
        </div>
      ))}

      {/* ===== AUTOMATION TAB ===== */}
      {activeTab === 'automation' && renderCard(automationRules, (r) => (
        <div key={r.id} className="content-card">
          <div className="content-card-header">
            <div className="content-card-icon" style={{ background: r.isActive ? 'rgba(34,197,94,0.1)' : 'rgba(107,114,128,0.1)', color: r.isActive ? '#22c55e' : '#9ca3af' }}><FaRobot /></div>
            <div className="content-card-info">
              <div className="content-card-title">{r.name}</div>
              <div className="content-card-subtitle">{r.triggerType} → {r.actionType}</div>
            </div>
            <span className={`status-badge ${r.isActive ? 'active' : 'inactive'}`}>{r.isActive ? 'Active' : 'Inactive'}</span>
          </div>
          <div className="content-card-stats">
            <span><FaChartBar size={11} /> {r.executionCount?.toLocaleString()} runs</span>
          </div>
          <div className="content-card-actions">
            <button className="content-action-btn content-action-view" onClick={() => openView(r)}><FaEye /> View</button>
          </div>
        </div>
      ))}

      {/* ===== VIEW DETAIL MODAL ===== */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Details</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {Object.entries(selectedItem).filter(([k]) => !['id', '_id'].includes(k)).map(([key, val]) => (
                <div key={key} className="detail-row">
                  <span className="detail-key">{key.replace(/([A-Z])/g, ' $1').replace(/^./, s => s.toUpperCase())}</span>
                  <span className="detail-val">{typeof val === 'object' ? JSON.stringify(val) : String(val)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit {activeTab === 'announcements' ? 'Announcement' : 'Promotion'}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Title</label>
                <input type="text" value={editData.title || ''} onChange={(e) => setEditData({ ...editData, title: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Message</label>
                <textarea value={editData.message || ''} onChange={(e) => setEditData({ ...editData, message: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, minHeight: 100, resize: 'vertical', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Status</label>
                <select value={editData.status || 'active'} onChange={(e) => setEditData({ ...editData, status: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14 }}>
                  <option value="active">Active</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
              <button className="content-action-btn content-action-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }} onClick={handleSaveEdit}>
                <FaSave /> Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== DELETE CONFIRMATION MODAL ===== */}
      {showDeleteModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Delete Confirmation</h3>
              <button className="modal-close" onClick={() => setShowDeleteModal(false)}><FaTimes /></button>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-muted)', marginBottom: 20 }}>
              Are you sure you want to delete <strong>"{selectedItem.title || selectedItem.name}"</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button className="content-action-btn content-action-view" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="content-action-btn content-action-delete" onClick={handleDelete}><FaTrash /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE MODAL ===== */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {activeTab === 'push' ? 'Send Notification' :
                 activeTab === 'announcements' ? 'Create Announcement' :
                 activeTab === 'promotions' ? 'Create Promotion' :
                 activeTab === 'email' ? 'Create Email Campaign' :
                 activeTab === 'sms' ? 'Create SMS Campaign' :
                 activeTab === 'inapp' ? 'Create In-App Content' :
                 activeTab === 'segments' ? 'Create Segment' :
                 'Create Automation Rule'}
              </h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Title</label>
                <input type="text" value={notificationData.title} onChange={(e) => setNotificationData({ ...notificationData, title: e.target.value })} placeholder="Enter title..." style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Message</label>
                <textarea value={notificationData.message} onChange={(e) => setNotificationData({ ...notificationData, message: e.target.value })} placeholder="Enter message..." style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14, minHeight: 100, resize: 'vertical', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Target Audience</label>
                <select value={notificationData.targetAudience} onChange={(e) => setNotificationData({ ...notificationData, targetAudience: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14 }}>
                  <option value="all">All Users</option>
                  <option value="passengers">Passengers</option>
                  <option value="drivers">Drivers</option>
                </select>
              </div>
              <div>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block' }}>Schedule For (Optional)</label>
                <input type="datetime-local" value={notificationData.scheduledFor} onChange={(e) => setNotificationData({ ...notificationData, scheduledFor: e.target.value })} style={{ width: '100%', padding: '12px', border: '2px solid var(--border-light)', borderRadius: 10, fontSize: 14 }} />
              </div>
              <button className="content-action-btn content-action-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }} onClick={activeTab === 'push' ? handleSendNotification : handleCreateAnnouncement}>
                <FaPaperPlane /> {activeTab === 'push' ? 'Send' : 'Create'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentNotifications;
