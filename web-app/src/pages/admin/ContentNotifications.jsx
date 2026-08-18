import React, { useState, useEffect, useMemo } from 'react';
import {
  FaBell, FaBullhorn, FaTag, FaEnvelope, FaSearch,
  FaPlus, FaEdit, FaTrash, FaCheckCircle, FaTimes,
  FaUsers, FaPaperPlane, FaCalendarAlt, FaEye, FaChartBar,
  FaSms, FaMobileAlt, FaLayerGroup, FaRobot, FaSave, FaThumbtack
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const AUDIENCE = [
  { v: 'all', l: 'All Users' },
  { v: 'passengers', l: 'Passengers' },
  { v: 'drivers', l: 'Drivers' },
];

const opts = (arr) => arr.map(s => ({ v: s, l: s.replace(/_/g, ' ') }));

const cap = (s) => String(s || '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());

const toDateInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

const toDateTimeInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d)) return '';
  const p = n => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};

const fmtDate = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

const fmtDateTime = (iso) => {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d)) return '—';
  return d.toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

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
  const [search, setSearch] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editData, setEditData] = useState({});
  const [formData, setFormData] = useState({});

  const TAB_META = useMemo(() => ({
    push: {
      key: 'push', label: 'Push', icon: <FaBell />, color: '#3b82f6', getItems: () => notifications,
      titleKey: 'title', subtitleKey: 'message',
      createFn: adminAPI.createPushNotification,
      updateFn: adminAPI.updatePushNotification,
      deleteFn: adminAPI.deletePushNotification,
      createFields: [
        { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Notification title' },
        { key: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Notification message' },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE, defaultValue: 'all' },
        { key: 'scheduledFor', label: 'Schedule For (Optional)', type: 'datetime' },
      ],
      editFields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'message', label: 'Message', type: 'textarea' },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE },
        { key: 'status', label: 'Status', type: 'select', options: opts(['draft', 'scheduled', 'sent', 'cancelled']) },
      ],
    },
    announcements: {
      key: 'announcements', label: 'Announcements', icon: <FaBullhorn />, color: '#10b981', getItems: () => announcements,
      titleKey: 'title', subtitleKey: 'message',
      createFn: adminAPI.createAnnouncement,
      updateFn: adminAPI.updateAnnouncement,
      deleteFn: adminAPI.deleteAnnouncement,
      createFields: [
        { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Announcement title' },
        { key: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'Announcement message' },
        { key: 'category', label: 'Category', type: 'select', options: opts(['maintenance', 'policy', 'feature', 'emergency', 'promotion', 'general']) },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE, defaultValue: 'all' },
        { key: 'scheduledFor', label: 'Schedule For (Optional)', type: 'datetime' },
        { key: 'expirationDate', label: 'Expiration Date (Optional)', type: 'datetime' },
      ],
      editFields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'message', label: 'Message', type: 'textarea' },
        { key: 'category', label: 'Category', type: 'select', options: opts(['maintenance', 'policy', 'feature', 'emergency', 'promotion', 'general']) },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE },
        { key: 'status', label: 'Status', type: 'select', options: opts(['draft', 'scheduled', 'active', 'expired', 'archived']) },
      ],
    },
    promotions: {
      key: 'promotions', label: 'Promotions', icon: <FaTag />, color: '#f59e0b', getItems: () => promotions,
      titleKey: 'title', subtitleKey: 'code',
      createFn: adminAPI.createPromoCode,
      updateFn: adminAPI.updatePromoCode,
      deleteFn: adminAPI.deletePromoCode,
      createFields: [
        { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Promotion title' },
        { key: 'code', label: 'Code', type: 'text', required: true, placeholder: 'e.g. WELCOME20' },
        { key: 'discountType', label: 'Discount Type', type: 'select', options: opts(['percentage', 'fixed_amount', 'free_ride']), defaultValue: 'percentage' },
        { key: 'discountValue', label: 'Discount Value', type: 'number', required: true, placeholder: 'e.g. 20' },
        { key: 'validFrom', label: 'Valid From', type: 'date' },
        { key: 'validUntil', label: 'Valid Until', type: 'date', required: true },
        { key: 'minFare', label: 'Min Fare (ETB)', type: 'number' },
        { key: 'usageLimit', label: 'Usage Limit (blank = unlimited)', type: 'number' },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE, defaultValue: 'all' },
      ],
      editFields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'code', label: 'Code', type: 'text' },
        { key: 'discountType', label: 'Discount Type', type: 'select', options: opts(['percentage', 'fixed_amount', 'free_ride']) },
        { key: 'discountValue', label: 'Discount Value', type: 'number' },
        { key: 'validUntil', label: 'Valid Until', type: 'date' },
        { key: 'status', label: 'Status', type: 'select', options: opts(['draft', 'active', 'expired', 'disabled']) },
      ],
    },
    email: {
      key: 'email', label: 'Email', icon: <FaEnvelope />, color: '#7c3aed', getItems: () => emailCampaigns,
      titleKey: 'name', subtitleKey: 'subject',
      createFn: adminAPI.createEmailCampaign,
      updateFn: adminAPI.updateEmailCampaign,
      deleteFn: adminAPI.deleteEmailCampaign,
      createFields: [
        { key: 'name', label: 'Campaign Name', type: 'text', required: true, placeholder: 'e.g. Monthly Newsletter' },
        { key: 'subject', label: 'Subject', type: 'text', required: true, placeholder: 'Email subject line' },
        { key: 'body', label: 'Body', type: 'textarea', required: true, placeholder: 'Email body' },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE, defaultValue: 'all' },
        { key: 'scheduledFor', label: 'Schedule For (Optional)', type: 'datetime' },
      ],
      editFields: [
        { key: 'name', label: 'Campaign Name', type: 'text' },
        { key: 'subject', label: 'Subject', type: 'text' },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE },
        { key: 'status', label: 'Status', type: 'select', options: opts(['draft', 'scheduled', 'sending', 'sent', 'cancelled']) },
      ],
    },
    sms: {
      key: 'sms', label: 'SMS', icon: <FaSms />, color: '#ec4899', getItems: () => smsCampaigns,
      titleKey: 'name', subtitleKey: 'message',
      createFn: adminAPI.createSMSCampaign,
      updateFn: adminAPI.updateSMSCampaign,
      deleteFn: adminAPI.deleteSMSCampaign,
      createFields: [
        { key: 'name', label: 'Campaign Name', type: 'text', required: true, placeholder: 'e.g. Trip Confirmation' },
        { key: 'message', label: 'Message', type: 'textarea', required: true, placeholder: 'SMS text' },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE, defaultValue: 'all' },
        { key: 'scheduledFor', label: 'Schedule For (Optional)', type: 'datetime' },
      ],
      editFields: [
        { key: 'name', label: 'Campaign Name', type: 'text' },
        { key: 'message', label: 'Message', type: 'textarea' },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE },
        { key: 'status', label: 'Status', type: 'select', options: opts(['draft', 'scheduled', 'sending', 'sent', 'cancelled']) },
      ],
    },
    inapp: {
      key: 'inapp', label: 'In-App', icon: <FaMobileAlt />, color: '#0ea5e9', getItems: () => inAppContent,
      titleKey: 'title', subtitleKey: 'type',
      createFn: adminAPI.createInAppContent,
      updateFn: adminAPI.updateInAppContent,
      deleteFn: adminAPI.deleteInAppContent,
      createFields: [
        { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'Content title' },
        { key: 'type', label: 'Type', type: 'select', options: opts(['banner', 'carousel', 'popup', 'modal', 'bottom_sheet']), defaultValue: 'banner' },
        { key: 'displayLocation', label: 'Display Location', type: 'select', options: opts(['home', 'trips', 'profile', 'wallet', 'all']), defaultValue: 'home' },
        { key: 'description', label: 'Description', type: 'textarea' },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE, defaultValue: 'all' },
        { key: 'priority', label: 'Priority (higher = first)', type: 'number' },
        { key: 'scheduledFor', label: 'Schedule For (Optional)', type: 'datetime' },
        { key: 'expirationDate', label: 'Expiration Date (Optional)', type: 'datetime' },
      ],
      editFields: [
        { key: 'title', label: 'Title', type: 'text' },
        { key: 'type', label: 'Type', type: 'select', options: opts(['banner', 'carousel', 'popup', 'modal', 'bottom_sheet']) },
        { key: 'displayLocation', label: 'Display Location', type: 'select', options: opts(['home', 'trips', 'profile', 'wallet', 'all']) },
        { key: 'status', label: 'Status', type: 'select', options: opts(['draft', 'scheduled', 'active', 'expired', 'archived']) },
      ],
    },
    segments: {
      key: 'segments', label: 'Segments', icon: <FaLayerGroup />, color: '#6366f1', getItems: () => segments,
      titleKey: 'name', subtitleKey: 'segmentType',
      createFn: adminAPI.createUserSegment,
      updateFn: adminAPI.updateUserSegment,
      deleteFn: adminAPI.deleteUserSegment,
      createFields: [
        { key: 'name', label: 'Segment Name', type: 'text', required: true, placeholder: 'e.g. Power Users' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'segmentType', label: 'Segment Type', type: 'select', options: opts(['location', 'behavior', 'spending', 'rating', 'custom']), defaultValue: 'behavior' },
        { key: 'targetRole', label: 'Target Role', type: 'select', options: opts(['all', 'passengers', 'drivers']), defaultValue: 'all' },
      ],
      editFields: [
        { key: 'name', label: 'Segment Name', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'segmentType', label: 'Segment Type', type: 'select', options: opts(['location', 'behavior', 'spending', 'rating', 'custom']) },
        { key: 'targetRole', label: 'Target Role', type: 'select', options: opts(['all', 'passengers', 'drivers']) },
        { key: 'isActive', label: 'Status', type: 'select', boolean: true, options: [{ v: 'true', l: 'Active' }, { v: 'false', l: 'Inactive' }] },
      ],
    },
    automation: {
      key: 'automation', label: 'Automation', icon: <FaRobot />, color: '#22c55e', getItems: () => automationRules,
      titleKey: 'name', subtitleKey: 'triggerType',
      createFn: adminAPI.createAutomationRule,
      updateFn: adminAPI.updateAutomationRule,
      deleteFn: adminAPI.deleteAutomationRule,
      createFields: [
        { key: 'name', label: 'Rule Name', type: 'text', required: true, placeholder: 'e.g. Welcome New Users' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'triggerType', label: 'Trigger', type: 'select', options: opts(['user_signup', 'first_trip_completed', 'trip_completed', 'inactive_user', 'birthday', 'anniversary', 'custom_event']), defaultValue: 'user_signup' },
        { key: 'actionType', label: 'Action', type: 'select', options: opts(['send_push', 'send_email', 'send_sms', 'create_promo', 'add_to_segment']), defaultValue: 'send_push' },
        { key: 'targetAudience', label: 'Target Audience', type: 'select', options: AUDIENCE, defaultValue: 'all' },
      ],
      editFields: [
        { key: 'name', label: 'Rule Name', type: 'text' },
        { key: 'description', label: 'Description', type: 'text' },
        { key: 'triggerType', label: 'Trigger', type: 'select', options: opts(['user_signup', 'first_trip_completed', 'trip_completed', 'inactive_user', 'birthday', 'anniversary', 'custom_event']) },
        { key: 'actionType', label: 'Action', type: 'select', options: opts(['send_push', 'send_email', 'send_sms', 'create_promo', 'add_to_segment']) },
        { key: 'isActive', label: 'Status', type: 'select', boolean: true, options: [{ v: 'true', l: 'Active' }, { v: 'false', l: 'Inactive' }] },
      ],
    },
  }), [notifications, announcements, promotions, emailCampaigns, smsCampaigns, inAppContent, segments, automationRules]);

  useEffect(() => { fetchContentData(); }, []);

  const fetchContentData = async () => {
    setLoading(true);
    try {
      const [pushRes, announcementsRes, promosRes, emailRes, smsRes, inAppRes, segmentsRes, automationRes] = await Promise.all([
        adminAPI.getPushNotifications({}).catch(() => null),
        adminAPI.getAnnouncements({}).catch(() => null),
        adminAPI.getPromoCodes({}).catch(() => null),
        adminAPI.getEmailCampaigns({}).catch(() => null),
        adminAPI.getSMSCampaigns({}).catch(() => null),
        adminAPI.getInAppContent({}).catch(() => null),
        adminAPI.getUserSegments({}).catch(() => null),
        adminAPI.getAutomationRules({}).catch(() => null)
      ]);
      setNotifications(pushRes?.data?.notifications || []);
      setAnnouncements(announcementsRes?.data?.announcements || []);
      setPromotions(promosRes?.data?.promoCodes || []);
      setEmailCampaigns(emailRes?.data?.campaigns || []);
      setSMSCampaigns(smsRes?.data?.campaigns || []);
      setInAppContent(inAppRes?.data?.content || []);
      setSegments(segmentsRes?.data?.segments || []);
      setAutomationRules(automationRes?.data?.rules || []);
    } catch (err) {
      console.error('Failed to fetch content data:', err);
    }
    setLoading(false);
  };

  const getStatus = (item) => item?.status || (item?.isActive ? 'active' : 'inactive');

  const cardSubtitle = (item) => {
    switch (activeTab) {
      case 'push': return item.message;
      case 'announcements': return item.message;
      case 'promotions':
        return `Code: ${item.code || '—'} • ${item.discountType === 'fixed_amount' ? `ETB ${item.discountValue}` : `${item.discountValue}${item.discountType === 'percentage' ? '%' : ' (free ride)'}`}`;
      case 'email': return item.subject;
      case 'sms': return item.message?.length > 60 ? `${item.message.substring(0, 60)}...` : item.message;
      case 'inapp': return `${item.type || ''} • ${item.displayLocation || ''}`;
      case 'segments': return `${item.segmentType || ''} • ${item.targetRole || ''}`;
      case 'automation': return `${item.triggerType || ''} → ${item.actionType || ''}`;
      default: return '';
    }
  };

  const cardStats = (item) => {
    const stats = [];
    const add = (icon, text) => stats.push({ icon, text });
    switch (activeTab) {
      case 'push':
        add(<FaUsers />, cap(item.targetAudience));
        add(<FaPaperPlane />, `${item.sentCount || 0} sent`);
        add(<FaEye />, `${item.openedCount || 0} opened`);
        break;
      case 'announcements':
        add(<FaEye />, `${item.viewCount || 0} views`);
        add(<FaCalendarAlt />, fmtDate(item.createdAt));
        if (item.isPinned) add(<FaThumbtack />, 'Pinned');
        break;
      case 'promotions':
        add(<FaUsers />, cap(item.targetAudience));
        add(<FaChartBar />, `${item.usedCount || 0}${item.usageLimit ? `/${item.usageLimit}` : ''} used`);
        add(<FaCalendarAlt />, `Expires ${fmtDate(item.validUntil)}`);
        break;
      case 'email':
        add(<FaPaperPlane />, `${item.sentCount || 0} sent`);
        add(<FaEye />, `${item.openedCount || 0} opened`);
        add(<FaCalendarAlt />, fmtDate(item.createdAt));
        break;
      case 'sms':
        add(<FaPaperPlane />, `${item.sentCount || 0} sent`);
        add(<FaCheckCircle />, `${item.deliveredCount || 0} delivered`);
        break;
      case 'inapp':
        add(<FaEye />, `${item.viewCount || 0} views`);
        add(<FaCalendarAlt />, fmtDate(item.createdAt));
        break;
      case 'segments':
        add(<FaUsers />, `${item.estimatedSize || 0} users`);
        add(<FaCalendarAlt />, fmtDate(item.createdAt));
        break;
      case 'automation':
        add(<FaChartBar />, `${item.executionCount || 0} runs`);
        if (item.nextExecutionAt) add(<FaCalendarAlt />, `Next ${fmtDate(item.nextExecutionAt)}`);
        break;
      default: break;
    }
    return stats;
  };

  const filteredItems = useMemo(() => {
    const items = TAB_META[activeTab]?.getItems() || [];
    if (!search.trim()) return items;
    const q = search.trim().toLowerCase();
    return items.filter(it => [it.title, it.name, it.code, it.message, it.subject]
      .some(v => v && String(v).toLowerCase().includes(q)));
  }, [TAB_META, activeTab, search]);

  const makeFormData = (cfg) => {
    const fd = {};
    cfg.createFields.forEach(f => { fd[f.key] = f.defaultValue !== undefined ? f.defaultValue : ''; });
    return fd;
  };

  const openCreate = () => {
    setFormData(makeFormData(TAB_META[activeTab]));
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    const cfg = TAB_META[activeTab];
    for (const f of cfg.createFields) {
      if (f.required && !String(formData[f.key] ?? '').trim()) {
        toast.error(`${f.label} is required`);
        return;
      }
    }
    const payload = {};
    cfg.createFields.forEach(f => {
      let v = formData[f.key];
      if (f.type === 'number' && v !== '' && v != null) v = Number(v);
      if (v !== '' && v != null) payload[f.key] = v;
    });
    try {
      await cfg.createFn(payload);
      toast.success(`${cfg.label} created successfully`);
      setShowCreateModal(false);
      setFormData({});
      fetchContentData();
    } catch (err) { toast.error(`Failed to create ${cfg.label.toLowerCase()}`); }
  };

  const openEdit = (item) => {
    setSelectedItem(item);
    const cfg = TAB_META[activeTab];
    const d = { ...item };
    cfg.editFields.forEach(f => {
      const v = d[f.key];
      if (f.type === 'datetime') d[f.key] = toDateTimeInput(v);
      else if (f.type === 'date') d[f.key] = toDateInput(v);
      else if (f.boolean) d[f.key] = v === undefined ? 'true' : String(v);
    });
    setEditData(d);
    setShowEditModal(true);
  };

  const handleSaveEdit = async () => {
    const cfg = TAB_META[activeTab];
    const payload = {};
    cfg.editFields.forEach(f => {
      let v = editData[f.key];
      if (f.boolean) v = v === 'true' || v === true;
      else if (f.type === 'number' && v !== '' && v != null) v = Number(v);
      payload[f.key] = v;
    });
    try {
      await cfg.updateFn(selectedItem._id, payload);
      toast.success('Updated successfully');
      setShowEditModal(false);
      setEditData({});
      setSelectedItem(null);
      fetchContentData();
    } catch (err) { toast.error('Failed to save changes'); }
  };

  const handleDelete = async () => {
    const cfg = TAB_META[activeTab];
    try {
      await cfg.deleteFn(selectedItem._id);
      toast.success('Deleted successfully');
      setShowDeleteModal(false);
      setSelectedItem(null);
      fetchContentData();
    } catch (err) { toast.error('Failed to delete'); }
  };

  const openView = (item) => { setSelectedItem(item); setShowDetailModal(true); };
  const openDelete = (item) => { setSelectedItem(item); setShowDeleteModal(true); };

  const detailRows = (item) => {
    const rows = [];
    const add = (label, val) => rows.push({ label, val });
    switch (activeTab) {
      case 'push':
        add('Title', item.title);
        add('Message', item.message);
        add('Status', getStatus(item));
        add('Target Audience', cap(item.targetAudience));
        add('Scheduled For', fmtDateTime(item.scheduledFor));
        add('Sent At', fmtDateTime(item.sentAt));
        add('Sent Count', item.sentCount || 0);
        add('Opened Count', item.openedCount || 0);
        add('Clicked Count', item.clickedCount || 0);
        add('Created', fmtDateTime(item.createdAt));
        break;
      case 'announcements':
        add('Title', item.title);
        add('Message', item.message);
        add('Status', getStatus(item));
        add('Category', cap(item.category));
        add('Target Audience', cap(item.targetAudience));
        add('Pinned', item.isPinned ? 'Yes' : 'No');
        add('Scheduled For', fmtDateTime(item.scheduledFor));
        add('Expires', fmtDateTime(item.expirationDate));
        add('Views', item.viewCount || 0);
        add('Created', fmtDateTime(item.createdAt));
        break;
      case 'promotions':
        add('Title', item.title);
        add('Code', item.code);
        add('Discount', item.discountType === 'fixed_amount' ? `ETB ${item.discountValue}` : `${item.discountValue}${item.discountType === 'percentage' ? '%' : ' (free ride)'}`);
        add('Status', getStatus(item));
        add('Target Audience', cap(item.targetAudience));
        add('Valid From', fmtDate(item.validFrom));
        add('Valid Until', fmtDate(item.validUntil));
        add('Min Fare', item.minFare ? `ETB ${item.minFare}` : '—');
        add('Usage', `${item.usedCount || 0}${item.usageLimit ? ` / ${item.usageLimit}` : ' (unlimited)'}`);
        add('Created', fmtDateTime(item.createdAt));
        break;
      case 'email':
        add('Name', item.name);
        add('Subject', item.subject);
        add('Body', item.body);
        add('Status', getStatus(item));
        add('Target Audience', cap(item.targetAudience));
        add('Scheduled For', fmtDateTime(item.scheduledFor));
        add('Sent Count', item.sentCount || 0);
        add('Opened Count', item.openedCount || 0);
        add('Clicked Count', item.clickedCount || 0);
        add('Bounced', item.bouncedCount || 0);
        add('Created', fmtDateTime(item.createdAt));
        break;
      case 'sms':
        add('Name', item.name);
        add('Message', item.message);
        add('Status', getStatus(item));
        add('Target Audience', cap(item.targetAudience));
        add('Scheduled For', fmtDateTime(item.scheduledFor));
        add('Sent Count', item.sentCount || 0);
        add('Delivered', item.deliveredCount || 0);
        add('Failed', item.failedCount || 0);
        add('Cost', item.cost ? `ETB ${item.cost}` : '—');
        add('Created', fmtDateTime(item.createdAt));
        break;
      case 'inapp':
        add('Title', item.title);
        add('Type', cap(item.type));
        add('Description', item.description);
        add('Display Location', cap(item.displayLocation));
        add('Status', getStatus(item));
        add('Target Audience', cap(item.targetAudience));
        add('Priority', item.priority || 0);
        add('Scheduled For', fmtDateTime(item.scheduledFor));
        add('Expires', fmtDateTime(item.expirationDate));
        add('Views', item.viewCount || 0);
        add('Clicks', item.clickCount || 0);
        add('Created', fmtDateTime(item.createdAt));
        break;
      case 'segments':
        add('Name', item.name);
        add('Description', item.description || '—');
        add('Segment Type', cap(item.segmentType));
        add('Target Role', cap(item.targetRole));
        add('Estimated Size', item.estimatedSize || 0);
        add('Status', item.isActive ? 'Active' : 'Inactive');
        add('Last Calculated', fmtDateTime(item.lastCalculatedAt));
        add('Created', fmtDateTime(item.createdAt));
        break;
      case 'automation':
        add('Name', item.name);
        add('Description', item.description || '—');
        add('Trigger', cap(item.triggerType));
        add('Action', cap(item.actionType));
        add('Target Audience', cap(item.targetAudience));
        add('Status', item.isActive ? 'Active' : 'Inactive');
        add('Executions', item.executionCount || 0);
        add('Success', item.successCount || 0);
        add('Failures', item.failureCount || 0);
        add('Next Run', fmtDateTime(item.nextExecutionAt));
        add('Created', fmtDateTime(item.createdAt));
        break;
      default: break;
    }
    return rows;
  };

  const renderField = (f, value, onChange) => {
    const inputStyle = {
      width: '100%', padding: '12px', border: '2px solid var(--border-light)',
      borderRadius: 10, fontSize: 14, outline: 'none', background: 'var(--card)', color: 'var(--text)'
    };
    const label = (
      <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 6, display: 'block', color: 'var(--text)' }}>
        {f.label}{f.required ? ' *' : ''}
      </label>
    );
    if (f.type === 'textarea') {
      return (
        <div key={f.key}>
          {label}
          <textarea value={value || ''} onChange={e => onChange(f.key, e.target.value)} placeholder={f.placeholder || ''} style={{ ...inputStyle, minHeight: 90, resize: 'vertical' }} />
        </div>
      );
    }
    if (f.type === 'select') {
      return (
        <div key={f.key}>
          {label}
          <select value={value ?? ''} onChange={e => onChange(f.key, e.target.value)} style={inputStyle}>
            {f.options.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
          </select>
        </div>
      );
    }
    if (f.type === 'datetime' || f.type === 'date' || f.type === 'number') {
      return (
        <div key={f.key}>
          {label}
          <input type={f.type} value={value ?? ''} onChange={e => onChange(f.key, e.target.value)} placeholder={f.placeholder || ''} style={inputStyle} />
        </div>
      );
    }
    return (
      <div key={f.key}>
        {label}
        <input type="text" value={value ?? ''} onChange={e => onChange(f.key, e.target.value)} placeholder={f.placeholder || ''} style={inputStyle} />
      </div>
    );
  };

  const renderCardItem = (item) => {
    const cfg = TAB_META[activeTab];
    const status = getStatus(item);
    const isBool = activeTab === 'segments' || activeTab === 'automation';
    return (
      <div key={item._id} className="content-card">
        <div className="content-card-header">
          <div className="content-card-icon" style={{ background: `${cfg.color}14`, color: cfg.color }}>{cfg.icon}</div>
          <div className="content-card-info">
            <div className="content-card-title">{item.title || item.name || 'Untitled'}</div>
            <div className="content-card-subtitle">{cardSubtitle(item)}</div>
          </div>
          <span className={`status-badge ${isBool ? (item.isActive ? 'active' : 'inactive') : status}`}>
            {isBool ? (item.isActive ? 'Active' : 'Inactive') : cap(status)}
          </span>
        </div>
        <div className="content-card-stats">
          {cardStats(item).map((s, i) => (
            <span key={i}>{s.icon} {s.text}</span>
          ))}
        </div>
        <div className="content-card-actions">
          <button className="content-action-btn content-action-view" onClick={() => openView(item)}><FaEye /> View</button>
          <button className="content-action-btn content-action-edit" onClick={() => openEdit(item)}><FaEdit /> Edit</button>
          <button className="content-action-btn content-action-delete" onClick={() => openDelete(item)}><FaTrash /> Delete</button>
        </div>
      </div>
    );
  };

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

  const meta = TAB_META[activeTab];

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 60 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
        <div className="admin-skeleton" style={{ height: 300 }}></div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      {/* Gradient Banner */}
      <div className="content-page-banner" style={{ background: `linear-gradient(135deg, #1e3a5f, ${meta.color})` }}>
        <div className="content-page-banner-icon">{meta.icon}</div>
        <div className="content-page-banner-title">
          {t('admin.contentNotifications') || 'Content & Notifications'}
          <span>{meta.label}</span>
        </div>
        <button className="content-banner-btn" onClick={openCreate}>
          <FaPlus /> New {meta.label.replace(/s$/, '')}
        </button>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 16 }}>
        {[
          { icon: <FaBell />, val: notifications.filter(n => n.status === 'sent').length || notifications.length, label: 'Push Notifications', color: '#3b82f6' },
          { icon: <FaBullhorn />, val: announcements.filter(a => a.status === 'active').length, label: 'Active Announcements', color: '#10b981' },
          { icon: <FaTag />, val: promotions.filter(p => p.status === 'active').length, label: 'Active Promos', color: '#f59e0b' },
          { icon: <FaRobot />, val: automationRules.filter(r => r.isActive).length, label: 'Active Automations', color: '#7c3aed' },
        ].map((s, i) => (
          <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
            <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
            <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
          </div>
        ))}
      </div>

      {/* Pill Tabs */}
      <div className="content-tab-row">
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => { setActiveTab(tab.key); setSearch(''); }} className={`analytics-tab-btn ${activeTab === tab.key ? 'active' : ''}`}>
            {tab.icon} {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="content-search-bar">
        <FaSearch className="content-search-icon" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={`Search ${meta.label.toLowerCase()}...`}
        />
      </div>

      {/* List */}
      {filteredItems.length === 0 ? (
        <div className="content-empty-card">
          <div className="content-empty-icon">{meta.icon}</div>
          <span>{search.trim() ? `No ${meta.label.toLowerCase()} match "${search}"` : `No ${meta.label.toLowerCase()} yet`}</span>
          {!search.trim() && (
            <button className="content-action-btn content-action-primary" onClick={openCreate}>
              <FaPlus /> Create {meta.label.replace(/s$/, '')}
            </button>
          )}
        </div>
      ) : (
        <div className="content-card-grid">
          {filteredItems.map(renderCardItem)}
        </div>
      )}

      {/* ===== VIEW DETAIL MODAL ===== */}
      {showDetailModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowDetailModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedItem.title || selectedItem.name || 'Details'}</h3>
              <button className="modal-close" onClick={() => setShowDetailModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {detailRows(selectedItem).map((r, i) => (
                <div key={i} className="detail-row">
                  <span className="detail-key">{r.label}</span>
                  <span className="detail-val">{r.val}</span>
                </div>
              ))}
            </div>
            <div className="content-modal-footer">
              <button className="content-action-btn content-action-edit" onClick={() => { setShowDetailModal(false); openEdit(selectedItem); }}><FaEdit /> Edit</button>
              <button className="content-action-btn content-action-delete" onClick={() => { setShowDetailModal(false); openDelete(selectedItem); }}><FaTrash /> Delete</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT MODAL ===== */}
      {showEditModal && selectedItem && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Edit {meta.label.replace(/s$/, '')}</h3>
              <button className="modal-close" onClick={() => setShowEditModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {meta.editFields.map(f => renderField(f, editData[f.key], (key, val) => setEditData({ ...editData, [key]: val })))}
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
              Are you sure you want to delete <strong>"{selectedItem.title || selectedItem.name || selectedItem.code}"</strong>? This action cannot be undone.
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
              <h3>Create {meta.label.replace(/s$/, '')}</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}><FaTimes /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {meta.createFields.map(f => renderField(f, formData[f.key], (key, val) => setFormData({ ...formData, [key]: val })))}
              <button className="content-action-btn content-action-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px 16px', fontSize: 14 }} onClick={handleCreate}>
                <FaPaperPlane /> Create {meta.label.replace(/s$/, '')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ContentNotifications;
