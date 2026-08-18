import React, { useState, useEffect } from 'react';
import {
  FaHeadset, FaTicketAlt, FaComments, FaBook, FaRobot, FaEnvelope,
  FaChartLine, FaUsers, FaClock, FaStar, FaCheckCircle, FaTimes,
  FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaPaperPlane, FaReply,
  FaForward, FaFlag, FaBell, FaDownload, FaCalendar, FaEye, FaThumbsUp,
  FaThumbsDown, FaExclamationTriangle, FaArrowUp, FaEllipsisH, FaCopy,
  FaUserClock, FaHourglassHalf, FaCheckSquare, FaSquare, FaTachometerAlt,
  FaSend, FaCog, FaList
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const SupportDashboard = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [analytics, setAnalytics] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [chats, setChats] = useState([]);
  const [faqs, setFaqs] = useState([]);
  const [cannedResponses, setCannedResponses] = useState([]);
  const [autoReplyRules, setAutoReplyRules] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [selectedChat, setSelectedChat] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showCannedModal, setShowCannedModal] = useState(false);
  const [showAutoReplyModal, setShowAutoReplyModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [newTicket, setNewTicket] = useState({ userId: '', category: 'other', priority: 'medium', subject: '', description: '' });
  const [newFAQ, setNewFAQ] = useState({ title: '', content: '', category: 'getting_started', tags: [], language: 'en' });
  const [newCannedResponse, setNewCannedResponse] = useState({ title: '', content: '', category: 'greeting', tags: [], language: 'en' });
  const [newAutoReplyRule, setNewAutoReplyRule] = useState({ name: '', trigger: '', triggerType: 'category', action: 'auto_reply', response: { message: '' }, category: 'other', priority: 'medium' });
  const [broadcastMessage, setBroadcastMessage] = useState({ message: '', targetAudience: 'all', title: '' });
  const [ticketMessage, setTicketMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');
  const [users, setUsers] = useState([]);
  const [userSearch, setUserSearch] = useState('');

  useEffect(() => {
    fetchSupportData();
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await adminAPI.users({ limit: 100 });
      const data = res.data;
      setUsers(Array.isArray(data) ? data : (data?.users || []));
    } catch (err) { /* silent — user picker optional */ }
  };

  const fetchSupportData = async () => {
    try {
      setLoading(true);
      const [analyticsRes, ticketsRes, chatsRes, faqsRes, cannedRes, rulesRes] = await Promise.all([
        adminAPI.getSupportAnalytics({}).catch(() => ({ data: null })),
        adminAPI.getTickets({}).catch(() => ({ data: {} })),
        adminAPI.getSupportChats({}).catch(() => ({ data: {} })),
        adminAPI.getFAQs({}).catch(() => ({ data: {} })),
        adminAPI.getCannedResponses({}).catch(() => ({ data: {} })),
        adminAPI.getAutoReplyRules({}).catch(() => ({ data: {} }))
      ]);

      setAnalytics(analyticsRes.data);
      const ticketsData = ticketsRes.data;
      setTickets(Array.isArray(ticketsData) ? ticketsData : (ticketsData?.tickets || ticketsData?.data || []));
      const chatsData = chatsRes.data;
      setChats(Array.isArray(chatsData) ? chatsData : (chatsData?.chats || chatsData?.data || []));
      const faqsData = faqsRes.data;
      setFaqs(Array.isArray(faqsData) ? faqsData : (faqsData?.faqs || faqsData?.data || []));
      const cannedData = cannedRes.data;
      setCannedResponses(Array.isArray(cannedData) ? cannedData : (cannedData?.responses || cannedData?.data || []));
      const rulesData = rulesRes.data;
      setAutoReplyRules(Array.isArray(rulesData) ? rulesData : (rulesData?.rules || rulesData?.data || []));
    } catch (err) {
      console.error('Error fetching support data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    if (!newTicket.userId) {
      toast.error('Select a user for this ticket');
      return;
    }
    if (!newTicket.subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    try {
      const res = await adminAPI.createTicket(newTicket);
      const created = res.data?.ticket;
      if (created?._id) setTickets(prev => [created, ...prev]);
      toast.success('Ticket created successfully');
      setShowTicketModal(false);
      setNewTicket({ userId: '', category: 'other', priority: 'medium', subject: '', description: '' });
      setUserSearch('');
    } catch (err) { toast.error('Failed to create ticket'); }
  };

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      await adminAPI.updateTicket(ticketId, updates);
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, ...updates } : t));
      toast.success('Ticket updated successfully');
    } catch (err) { toast.error('Failed to update ticket'); }
  };

  const handleAddTicketMessage = async (ticketId) => {
    if (!ticketMessage.trim()) return;
    try {
      await adminAPI.addTicketMessage(ticketId, ticketMessage, false, []);
      toast.success('Message added');
      setTicketMessage('');
    } catch (err) { toast.error('Failed to add message'); }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      await adminAPI.resolveTicket(ticketId, 'Resolved by admin');
      setTickets(prev => prev.map(t => t._id === ticketId ? { ...t, status: 'resolved' } : t));
      if (selectedTicket?._id === ticketId) setSelectedTicket(prev => ({ ...prev, status: 'resolved' }));
      toast.success('Ticket resolved');
      setSelectedTicket(null);
    } catch (err) { toast.error('Failed to resolve ticket'); }
  };

  const handleCreateFAQ = async () => {
    try {
      const res = await adminAPI.createFAQ(newFAQ);
      const created = res.data?.faq;
      if (created?._id) setFaqs(prev => [created, ...prev]);
      toast.success('FAQ created successfully');
      setShowFAQModal(false);
      setNewFAQ({ title: '', content: '', category: 'getting_started', tags: [], language: 'en' });
    } catch (err) { toast.error('Failed to create FAQ'); }
  };

  const handleCreateCannedResponse = async () => {
    try {
      const res = await adminAPI.createCannedResponse(newCannedResponse);
      const created = res.data?.response;
      if (created?._id) setCannedResponses(prev => [created, ...prev]);
      toast.success('Canned response created');
      setShowCannedModal(false);
      setNewCannedResponse({ title: '', content: '', category: 'greeting', tags: [], language: 'en' });
    } catch (err) { toast.error('Failed to create canned response'); }
  };

  const handleCreateAutoReplyRule = async () => {
    try {
      const res = await adminAPI.createAutoReplyRule(newAutoReplyRule);
      const created = res.data?.rule;
      if (created?._id) setAutoReplyRules(prev => [created, ...prev]);
      toast.success('Auto reply rule created');
      setShowAutoReplyModal(false);
      setNewAutoReplyRule({ name: '', trigger: '', triggerType: 'category', action: 'auto_reply', response: { message: '' }, category: 'other', priority: 'medium' });
    } catch (err) { toast.error('Failed to create auto reply rule'); }
  };

  const handleSendBroadcast = async () => {
    try {
      await adminAPI.sendBroadcastMessage(broadcastMessage.message, broadcastMessage.targetAudience, broadcastMessage.title);
      toast.success('Broadcast sent successfully');
      setShowBroadcastModal(false);
      setBroadcastMessage({ message: '', targetAudience: 'all', title: '' });
    } catch (err) { toast.error('Failed to send broadcast'); }
  };

  const handleDeleteFAQ = async (faqId) => {
    try { await adminAPI.deleteFAQ(faqId); setFaqs(prev => prev.filter(f => f._id !== faqId)); toast.success('FAQ deleted'); }
    catch (err) { toast.error('Failed to delete FAQ'); }
  };

  const handleDeleteCannedResponse = async (responseId) => {
    try { await adminAPI.deleteCannedResponse(responseId); setCannedResponses(prev => prev.filter(r => r._id !== responseId)); toast.success('Canned response deleted'); }
    catch (err) { toast.error('Failed to delete canned response'); }
  };

  const handleDeleteAutoReplyRule = async (ruleId) => {
    try { await adminAPI.deleteAutoReplyRule(ruleId); setAutoReplyRules(prev => prev.filter(r => r._id !== ruleId)); toast.success('Auto reply rule deleted'); }
    catch (err) { toast.error('Failed to delete auto reply rule'); }
  };

  const handleSendChatMessage = async (chatId) => {
    if (!chatMessage.trim()) return;
    try {
      await adminAPI.sendChatMessage(chatId, chatMessage);
      toast.success('Message sent');
      setChatMessage('');
      fetchSupportData();
    } catch (err) { toast.error('Failed to send message'); }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#22c55e';
      case 'in_progress': return '#eab308';
      case 'waiting': return '#f97316';
      case 'resolved': case 'closed': return '#6b7280';
      case 'active': return '#22c55e';
      case 'transferred': case 'ended': return '#6b7280';
      default: return '#6b7280';
    }
  };

  const getStatusBg = (status) => {
    switch (status) {
      case 'open': case 'active': return 'rgba(34, 197, 94, 0.1)';
      case 'in_progress': return 'rgba(234, 179, 8, 0.1)';
      case 'waiting': return 'rgba(249, 115, 22, 0.1)';
      case 'resolved': case 'closed': case 'ended': return 'rgba(107, 114, 128, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#dc2626';
      case 'high': return '#f97316';
      case 'medium': return '#eab308';
      case 'low': return '#22c55e';
      default: return '#6b7280';
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-skeleton" style={{ height: 80 }}></div>
        <div className="admin-skeleton" style={{ height: 200 }}></div>
        <div className="admin-skeleton" style={{ height: 300 }}></div>
      </div>
    );
  }

  const openTickets = tickets.filter(t => t.status === 'open' || t.status === 'in_progress').length;
  const activeChats = chats.filter(c => c.status === 'active').length;

  const tabs = [
    { key: 'overview', icon: <FaChartLine />, label: 'Overview' },
    { key: 'tickets', icon: <FaTicketAlt />, label: 'Tickets', count: openTickets },
    { key: 'chats', icon: <FaComments />, label: 'Live Chat', count: activeChats },
    { key: 'faqs', icon: <FaBook />, label: 'Knowledge Base' },
    { key: 'canned', icon: <FaReply />, label: 'Canned Responses' },
    { key: 'auto', icon: <FaRobot />, label: 'Auto Replies' },
  ];

  return (
    <div className="admin-page">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 16px', background: 'linear-gradient(135deg, #1e3a5f, #7c3aed)', borderRadius: 12, marginBottom: 16, color: 'white' }}>
        <FaHeadset style={{ fontSize: 20 }} />
        <span style={{ fontWeight: 700, fontSize: 15 }}>{t('admin.supportDashboard') || 'Support System'}</span>
        <button onClick={() => setShowBroadcastModal(true)} style={{ marginLeft: 'auto', padding: '6px 14px', borderRadius: 16, border: '1px solid rgba(255,255,255,0.3)', background: 'rgba(255,255,255,0.15)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <FaBell style={{ fontSize: 10 }} /> Broadcast
        </button>
      </div>

      <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap', overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4 }}>
        {tabs.map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6, padding: '6px 14px',
            borderRadius: 16, border: activeTab === tab.key ? 'none' : '1px solid #e5e7eb',
            fontSize: 12, fontWeight: 600, cursor: 'pointer', whiteSpace: 'nowrap',
            background: activeTab === tab.key ? 'linear-gradient(135deg, #3b82f6, #7c3aed)' : 'white',
            color: activeTab === tab.key ? 'white' : '#6b7280', transition: 'all 0.2s ease',
          }}>
            {tab.icon} {tab.label}
            {tab.count > 0 && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                minWidth: 20, height: 20, borderRadius: 10, fontSize: 10, fontWeight: 700,
                background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#dc2626',
                color: 'white',
              }}>{tab.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ===== OVERVIEW TAB ===== */}
      {activeTab === 'overview' && (
        <div>
          <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
            {[
              { icon: <FaTicketAlt />, val: tickets.length || analytics?.tickets?.total || 0, label: t('admin.totalTickets') || 'Total Tickets', color: '#3b82f6' },
              { icon: <FaHourglassHalf />, val: openTickets || analytics?.tickets?.open || 0, label: t('admin.openTickets') || 'Open Tickets', color: '#f97316' },
              { icon: <FaCheckCircle />, val: tickets.filter(t => t.status === 'resolved').length || analytics?.tickets?.resolved || 0, label: t('admin.resolvedTickets') || 'Resolved', color: '#22c55e' },
              { icon: <FaClock />, val: `${analytics?.performance?.avgResponseTime ?? 0}m`, label: t('admin.avgResponseTime') || 'Avg Response', color: '#eab308' },
              { icon: <FaStar />, val: analytics?.performance?.avgSatisfaction ?? '0.00', label: t('admin.satisfaction') || 'Satisfaction', color: '#22c55e' },
              { icon: <FaComments />, val: analytics?.chats?.active ?? activeChats, label: t('admin.activeChats') || 'Active Chats', color: '#7c3aed' },
            ].map((s, i) => (
              <div key={i} className="admin-stat-card" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="admin-stat-icon" style={{ background: `${s.color}12`, color: s.color }}>{s.icon}</div>
                <div><div className="admin-stat-value">{s.val}</div><div className="admin-stat-label">{s.label}</div></div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16, marginBottom: 20 }}>
            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaTicketAlt style={{ color: '#3b82f6', fontSize: 14 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{t('admin.ticketsByCategory') || 'Tickets by Category'}</span>
              </div>
              <div>
                {(!analytics?.tickets?.byCategory || analytics.tickets.byCategory.length === 0) ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No category data</div>
                ) : analytics.tickets.byCategory.map((cat, idx) => {
                  const maxCount = Math.max(...analytics.tickets.byCategory.map(c => c.count || 0), 1);
                  const pct = ((cat.count || 0) / maxCount) * 100;
                  return (
                    <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < analytics.tickets.byCategory.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)', textTransform: 'capitalize' }}>{cat._id || 'Other'}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)' }}>{cat.count || 0}</span>
                      </div>
                      <div style={{ width: '100%', height: 6, background: 'var(--bg-secondary, rgba(0,0,0,0.05))', borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ width: `${pct}%`, height: '100%', background: 'linear-gradient(90deg, #3b82f6, #7c3aed)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaBook style={{ color: '#7c3aed', fontSize: 14 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{t('admin.popularFAQs') || 'Popular FAQs'}</span>
              </div>
              <div>
                {(!analytics?.faqs?.popular || analytics.faqs.popular.length === 0) ? (
                  <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No FAQ data</div>
                ) : analytics.faqs.popular.slice(0, 5).map((faq, idx) => (
                  <div key={idx} style={{ padding: '10px 16px', borderBottom: idx < Math.min(analytics.faqs.popular.length, 5) - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{faq.title}</div>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{faq.views} views</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <FaTicketAlt style={{ color: '#3b82f6', fontSize: 14 }} />
                <span style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>Recent Tickets</span>
              </div>
              <button onClick={() => setActiveTab('tickets')} style={{ padding: '4px 12px', borderRadius: 12, border: '1px solid #e5e7eb', background: 'white', color: '#6b7280', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}>View All</button>
            </div>
            <div>
              {tickets.length === 0 ? (
                <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>No tickets yet</div>
              ) : tickets.slice(0, 3).map((ticket, idx) => (
                <div key={ticket._id} style={{ padding: '12px 16px', borderBottom: idx < Math.min(tickets.length, 3) - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: getStatusBg(ticket.status), color: getStatusColor(ticket.status), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                      {ticket.ticketNumber?.slice(-3) || '000'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 13, color: 'var(--text)' }}>{ticket.subject}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ticket.category} · {ticket.priority}</div>
                    </div>
                  </div>
                  <span style={{ background: `${getStatusColor(ticket.status)}15`, color: getStatusColor(ticket.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{ticket.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== TICKETS TAB ===== */}
      {activeTab === 'tickets' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}><FaTicketAlt /> Tickets ({tickets.length})</div>
            <button onClick={() => setShowTicketModal(true)} style={{ padding: '6px 14px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FaPlus /> New Ticket
            </button>
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {tickets.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaTicketAlt style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No tickets yet</p>
              </div>
            ) : tickets.map((ticket, idx) => (
              <div key={ticket._id} style={{ padding: '14px 16px', borderBottom: idx < tickets.length - 1 ? '1px solid var(--border-light)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8, flexWrap: 'wrap', gap: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 8, background: getStatusBg(ticket.status), color: getStatusColor(ticket.status), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700 }}>
                      {ticket.ticketNumber?.slice(-3) || '000'}
                    </div>
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{ticket.subject}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{ticket.description?.slice(0, 60) || 'No description'}</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <span style={{ background: `${getPriorityColor(ticket.priority)}15`, color: getPriorityColor(ticket.priority), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{ticket.priority}</span>
                    <span style={{ background: `${getStatusColor(ticket.status)}15`, color: getStatusColor(ticket.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{ticket.status}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                    <>
                      <button className="driver-action-btn driver-btn-reactivate" onClick={() => handleResolveTicket(ticket._id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                        <FaCheckCircle /> Resolve
                      </button>
                      <button className="driver-action-btn driver-btn-view" onClick={() => setSelectedTicket(ticket)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}>
                        <FaEye /> View
                      </button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CHATS TAB ===== */}
      {activeTab === 'chats' && (
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', marginBottom: 12 }}><FaComments /> Live Chat ({chats.length})</div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {chats.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaComments style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No active chats</p>
              </div>
            ) : chats.map((chat, idx) => (
              <div key={chat._id} style={{ padding: '14px 16px', borderBottom: idx < chats.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: '50%', background: getStatusBg(chat.status), color: getStatusColor(chat.status), display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 700 }}>
                    {chat.participants?.[0]?.user?.firstName?.[0] || '?'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{chat.participants?.[0]?.user?.firstName} {chat.participants?.[0]?.user?.lastName}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{chat.messages?.length || 0} messages</div>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ background: `${getStatusColor(chat.status)}15`, color: getStatusColor(chat.status), fontSize: 10, padding: '4px 10px', borderRadius: 12, fontWeight: 700, textTransform: 'capitalize' }}>{chat.status}</span>
                  {chat.status === 'active' && (
                    <button className="driver-action-btn driver-btn-view" onClick={() => setSelectedChat(chat)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#3b82f6', color: 'white', fontWeight: 600 }}>
                      <FaComments /> Join
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== FAQs TAB ===== */}
      {activeTab === 'faqs' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}><FaBook /> Knowledge Base ({faqs.length})</div>
            <button onClick={() => setShowFAQModal(true)} style={{ padding: '6px 14px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FaPlus /> New FAQ
            </button>
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {faqs.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaBook style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No FAQs yet</p>
              </div>
            ) : faqs.map((faq, idx) => (
              <div key={faq._id} style={{ padding: '14px 16px', borderBottom: idx < faqs.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(124,58,237,0.1)', color: '#7c3aed', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaBook style={{ fontSize: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{faq.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{faq.category} · {faq.views || 0} views</div>
                  </div>
                </div>
                <button className="driver-action-btn driver-btn-ban" onClick={() => handleDeleteFAQ(faq._id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dc2626', color: 'white', fontWeight: 600 }}>
                  <FaTrash /> Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CANNED RESPONSES TAB ===== */}
      {activeTab === 'canned' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}><FaReply /> Canned Responses ({cannedResponses.length})</div>
            <button onClick={() => setShowCannedModal(true)} style={{ padding: '6px 14px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FaPlus /> New Response
            </button>
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {cannedResponses.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaReply style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No canned responses yet</p>
              </div>
            ) : cannedResponses.map((response, idx) => (
              <div key={response._id} style={{ padding: '14px 16px', borderBottom: idx < cannedResponses.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(59,130,246,0.1)', color: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaReply style={{ fontSize: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{response.title}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{response.category} · {response.useCount || 0} uses</div>
                  </div>
                </div>
                <button className="driver-action-btn driver-btn-ban" onClick={() => handleDeleteCannedResponse(response._id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dc2626', color: 'white', fontWeight: 600 }}>
                  <FaTrash /> Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== AUTO REPLIES TAB ===== */}
      {activeTab === 'auto' && (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}><FaRobot /> Auto Replies ({autoReplyRules.length})</div>
            <button onClick={() => setShowAutoReplyModal(true)} style={{ padding: '6px 14px', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: 'white', fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
              <FaPlus /> New Rule
            </button>
          </div>
          <div style={{ background: 'var(--card)', borderRadius: 12, border: '1px solid var(--border-light)', overflow: 'hidden' }}>
            {autoReplyRules.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center' }}>
                <FaRobot style={{ fontSize: 48, color: 'var(--text-muted)', marginBottom: 16 }} />
                <p style={{ color: 'var(--text-muted)' }}>No auto reply rules yet</p>
              </div>
            ) : autoReplyRules.map((rule, idx) => (
              <div key={rule._id} style={{ padding: '14px 16px', borderBottom: idx < autoReplyRules.length - 1 ? '1px solid var(--border-light)' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: 'rgba(249,115,22,0.1)', color: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <FaRobot style={{ fontSize: 14 }} />
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{rule.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{rule.triggerType}: {rule.trigger} → {rule.action}</div>
                  </div>
                </div>
                <button className="driver-action-btn driver-btn-ban" onClick={() => handleDeleteAutoReplyRule(rule._id)} style={{ padding: '6px 12px', fontSize: 11, borderRadius: 6, border: 'none', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 4, background: '#dc2626', color: 'white', fontWeight: 600 }}>
                  <FaTrash /> Delete
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== CREATE TICKET MODAL ===== */}
      {showTicketModal && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Ticket</h3>
              <button className="modal-close" onClick={() => setShowTicketModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>User</label>
                {(newTicket.userId ? [users.find(u => u._id === newTicket.userId)].filter(Boolean) : []).map(u => (
                  <div key={u._id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderRadius: 10, background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.3)', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.firstName} {u.lastName}</span>
                    <button onClick={() => setNewTicket({ ...newTicket, userId: '' })} style={{ border: 'none', background: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>Change</button>
                  </div>
                ))}
                {!newTicket.userId && (
                  <>
                    <input type="text" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box', marginBottom: 8 }} placeholder="Search user by name or phone..." />
                    <div style={{ maxHeight: 150, overflowY: 'auto', border: '1px solid var(--border-light)', borderRadius: 10 }}>
                      {(userSearch.trim()
                        ? users.filter(u => `${u.firstName} ${u.lastName} ${u.phoneNumber || ''}`.toLowerCase().includes(userSearch.toLowerCase())).slice(0, 30)
                        : users.slice(0, 30)
                      ).map(u => (
                        <div key={u._id} onClick={() => setNewTicket({ ...newTicket, userId: u._id })} style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid var(--border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{u.firstName} {u.lastName}</span>
                          <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{u.phoneNumber} · {u.role}</span>
                        </div>
                      ))}
                      {users.length === 0 && <div style={{ padding: 12, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No users found</div>}
                    </div>
                  </>
                )}
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Category</label>
                <select value={newTicket.category} onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }}>
                  <option value="payment">Payment</option>
                  <option value="trip">Trip</option>
                  <option value="account">Account</option>
                  <option value="app">App</option>
                  <option value="safety">Safety</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Priority</label>
                <select value={newTicket.priority} onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }}>
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Subject</label>
                <input type="text" value={newTicket.subject} onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Enter subject" />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Description</label>
                <textarea value={newTicket.description} onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 100, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Describe the issue..." />
              </div>
              <button onClick={handleCreateTicket} style={{ marginTop: 16, width: '100%', padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: 'white', fontWeight: 600 }}>
                <FaTicketAlt /> Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE FAQ MODAL ===== */}
      {showFAQModal && (
        <div className="modal-overlay" onClick={() => setShowFAQModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create FAQ</h3>
              <button className="modal-close" onClick={() => setShowFAQModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Title</label>
                <input type="text" value={newFAQ.title} onChange={(e) => setNewFAQ({ ...newFAQ, title: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Enter FAQ title" />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Category</label>
                <select value={newFAQ.category} onChange={(e) => setNewFAQ({ ...newFAQ, category: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }}>
                  <option value="getting_started">Getting Started</option>
                  <option value="account">Account</option>
                  <option value="payment">Payment</option>
                  <option value="trips">Trips</option>
                  <option value="driver">Driver</option>
                  <option value="safety">Safety</option>
                  <option value="technical">Technical</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Content</label>
                <textarea value={newFAQ.content} onChange={(e) => setNewFAQ({ ...newFAQ, content: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 150, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Enter FAQ content..." />
              </div>
              <button onClick={handleCreateFAQ} style={{ marginTop: 16, width: '100%', padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: 'white', fontWeight: 600 }}>
                <FaBook /> Create FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE CANNED RESPONSE MODAL ===== */}
      {showCannedModal && (
        <div className="modal-overlay" onClick={() => setShowCannedModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Canned Response</h3>
              <button className="modal-close" onClick={() => setShowCannedModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Title</label>
                <input type="text" value={newCannedResponse.title} onChange={(e) => setNewCannedResponse({ ...newCannedResponse, title: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Enter response title" />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Category</label>
                <select value={newCannedResponse.category} onChange={(e) => setNewCannedResponse({ ...newCannedResponse, category: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }}>
                  <option value="greeting">Greeting</option>
                  <option value="payment">Payment</option>
                  <option value="trip">Trip</option>
                  <option value="account">Account</option>
                  <option value="technical">Technical</option>
                  <option value="safety">Safety</option>
                  <option value="closing">Closing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Content</label>
                <textarea value={newCannedResponse.content} onChange={(e) => setNewCannedResponse({ ...newCannedResponse, content: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 100, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Enter response content..." />
              </div>
              <button onClick={handleCreateCannedResponse} style={{ marginTop: 16, width: '100%', padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: 'white', fontWeight: 600 }}>
                <FaReply /> Create Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CREATE AUTO REPLY MODAL ===== */}
      {showAutoReplyModal && (
        <div className="modal-overlay" onClick={() => setShowAutoReplyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Create Auto Reply Rule</h3>
              <button className="modal-close" onClick={() => setShowAutoReplyModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Rule Name</label>
                <input type="text" value={newAutoReplyRule.name} onChange={(e) => setNewAutoReplyRule({ ...newAutoReplyRule, name: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Enter rule name" />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Trigger Type</label>
                <select value={newAutoReplyRule.triggerType} onChange={(e) => setNewAutoReplyRule({ ...newAutoReplyRule, triggerType: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }}>
                  <option value="category">Category</option>
                  <option value="priority">Priority</option>
                  <option value="keyword">Keyword</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Trigger Value</label>
                <input type="text" value={newAutoReplyRule.trigger} onChange={(e) => setNewAutoReplyRule({ ...newAutoReplyRule, trigger: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="e.g. payment, urgent, refund" />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Action</label>
                <select value={newAutoReplyRule.action} onChange={(e) => setNewAutoReplyRule({ ...newAutoReplyRule, action: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }}>
                  <option value="auto_reply">Auto Reply</option>
                  <option value="auto_escalate">Auto Escalate</option>
                  <option value="auto_assign">Auto Assign</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Response Message</label>
                <textarea value={newAutoReplyRule.response.message} onChange={(e) => setNewAutoReplyRule({ ...newAutoReplyRule, response: { ...newAutoReplyRule.response, message: e.target.value } })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 80, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Enter auto-reply message..." />
              </div>
              <button onClick={handleCreateAutoReplyRule} style={{ marginTop: 16, width: '100%', padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: 'white', fontWeight: 600 }}>
                <FaRobot /> Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== BROADCAST MODAL ===== */}
      {showBroadcastModal && (
        <div className="modal-overlay" onClick={() => setShowBroadcastModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Send Broadcast</h3>
              <button className="modal-close" onClick={() => setShowBroadcastModal(false)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Title</label>
                <input type="text" value={broadcastMessage.title} onChange={(e) => setBroadcastMessage({ ...broadcastMessage, title: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Enter broadcast title" />
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Target Audience</label>
                <select value={broadcastMessage.targetAudience} onChange={(e) => setBroadcastMessage({ ...broadcastMessage, targetAudience: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', fontSize: 14, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }}>
                  <option value="all">All Users</option>
                  <option value="drivers">Drivers Only</option>
                  <option value="passengers">Passengers Only</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Message</label>
                <textarea value={broadcastMessage.message} onChange={(e) => setBroadcastMessage({ ...broadcastMessage, message: e.target.value })} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 100, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Enter broadcast message..." />
              </div>
              <button onClick={handleSendBroadcast} style={{ marginTop: 16, width: '100%', padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, #dc2626, #b91c1c)', color: 'white', fontWeight: 600 }}>
                <FaBell /> Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== TICKET DETAIL MODAL ===== */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedTicket.ticketNumber}</h3>
              <button className="modal-close" onClick={() => setSelectedTicket(null)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div style={{ background: 'var(--bg-secondary, #f9fafb)', borderRadius: 10, padding: 10, marginBottom: 12 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
                  {selectedTicket.user?.firstName} {selectedTicket.user?.lastName} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>· {selectedTicket.user?.phoneNumber || selectedTicket.user?.email || ''}</span>
                </div>
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>{selectedTicket.category} · {selectedTicket.source || 'web'} · {new Date(selectedTicket.createdAt).toLocaleString()}</div>
              </div>
              <div className="detail-row">
                <span className="detail-key">Subject</span>
                <span className="detail-val">{selectedTicket.subject}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Status</span>
                <span className="detail-val" style={{ color: getStatusColor(selectedTicket.status) }}>{selectedTicket.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Priority</span>
                <span className="detail-val" style={{ color: getPriorityColor(selectedTicket.priority) }}>{selectedTicket.priority}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Description</span>
                <span className="detail-val">{selectedTicket.description || 'N/A'}</span>
              </div>
              {(selectedTicket.messages || []).length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8, fontWeight: 600 }}>MESSAGE THREAD</div>
                  <div style={{ maxHeight: 180, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(selectedTicket.messages || []).map((msg, idx) => (
                      <div key={idx} style={{ padding: '8px 12px', borderRadius: 10, background: msg.isInternal ? 'rgba(234,179,8,0.08)' : 'rgba(59,130,246,0.08)', fontSize: 12, color: 'var(--text)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{msg.isInternal ? 'Internal note' : 'User message'} · {new Date(msg.createdAt).toLocaleString()}</div>
                        {msg.message || msg.content || ''}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 8 }}>Add Message</label>
                <textarea value={ticketMessage} onChange={(e) => setTicketMessage(e.target.value)} style={{ width: '100%', padding: 12, borderRadius: 10, border: '2px solid var(--border-light)', minHeight: 80, fontSize: 14, resize: 'vertical', background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)', boxSizing: 'border-box' }} placeholder="Type your message..." />
              </div>
              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button onClick={() => handleAddTicketMessage(selectedTicket._id)} style={{ flex: 1, padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: 'linear-gradient(135deg, #3b82f6, #7c3aed)', color: 'white', fontWeight: 600 }}>
                  <FaPaperPlane /> Send Message
                </button>
                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' && (
                  <button onClick={() => handleResolveTicket(selectedTicket._id)} style={{ flex: 1, padding: 10, fontSize: 13, borderRadius: 8, border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, background: '#22c55e', color: 'white', fontWeight: 600 }}>
                    <FaCheckCircle /> Resolve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== CHAT DETAIL MODAL ===== */}
      {selectedChat && (
        <div className="modal-overlay" onClick={() => setSelectedChat(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 500 }}>
            <div className="modal-header">
              <h3>Chat with {selectedChat.participants?.[0]?.user?.firstName || 'User'}</h3>
              <button className="modal-close" onClick={() => setSelectedChat(null)}><FaTimes /></button>
            </div>
            <div className="driver-detail">
              <div style={{ maxHeight: 300, overflowY: 'auto', marginBottom: 12, padding: 12, background: 'var(--bg-secondary, #f9fafb)', borderRadius: 10 }}>
                {(selectedChat.messages || []).length === 0 ? (
                  <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 13, padding: 20 }}>No messages yet</div>
                ) : (selectedChat.messages || []).map((msg, idx) => (
                  <div key={idx} style={{ marginBottom: 8, padding: '8px 12px', borderRadius: 8, background: msg.sender === selectedChat.participants?.[0]?.user?._id ? 'rgba(59,130,246,0.1)' : 'white', fontSize: 13, color: 'var(--text)' }}>
                    <div style={{ fontWeight: 600, fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{msg.senderName || 'User'}</div>
                    {msg.content || msg.text || ''}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="text" value={chatMessage} onChange={(e) => setChatMessage(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage(selectedChat._id)} style={{ flex: 1, padding: 10, borderRadius: 8, border: '2px solid var(--border-light)', fontSize: 13, background: 'var(--bg-secondary, #f9fafb)', color: 'var(--text)' }} placeholder="Type a message..." />
                <button onClick={() => handleSendChatMessage(selectedChat._id)} style={{ padding: '8px 16px', borderRadius: 8, border: 'none', background: '#3b82f6', color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 600 }}>
                  <FaPaperPlane /> Send
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDashboard;
