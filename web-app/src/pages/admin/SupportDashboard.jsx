import React, { useState, useEffect } from 'react';
import {
  FaHeadset, FaTicketAlt, FaComments, FaBook, FaRobot, FaEnvelope,
  FaChartLine, FaUsers, FaClock, FaStar, FaCheckCircle, FaTimes,
  FaSearch, FaFilter, FaPlus, FaEdit, FaTrash, FaPaperPlane, FaReply,
  FaForward, FaFlag, FaBell, FaDownload, FaCalendar, FaEye, FaThumbsUp,
  FaThumbsDown, FaExclamationTriangle, FaArrowUp, FaEllipsisH, FaCopy,
  FaUserClock, FaHourglassHalf, FaCheckSquare, FaSquare, FaTachometerAlt
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
  const [selectedFAQ, setSelectedFAQ] = useState(null);
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [showCannedModal, setShowCannedModal] = useState(false);
  const [showAutoReplyModal, setShowAutoReplyModal] = useState(false);
  const [showBroadcastModal, setShowBroadcastModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newTicket, setNewTicket] = useState({
    userId: '',
    category: 'other',
    priority: 'medium',
    subject: '',
    description: ''
  });
  const [newFAQ, setNewFAQ] = useState({
    title: '',
    content: '',
    category: 'getting_started',
    tags: [],
    language: 'en'
  });
  const [newCannedResponse, setNewCannedResponse] = useState({
    title: '',
    content: '',
    category: 'greeting',
    tags: [],
    language: 'en'
  });
  const [newAutoReplyRule, setNewAutoReplyRule] = useState({
    name: '',
    trigger: '',
    triggerType: 'category',
    action: 'auto_reply',
    response: { message: '' },
    category: 'other',
    priority: 'medium'
  });
  const [broadcastMessage, setBroadcastMessage] = useState({
    message: '',
    targetAudience: 'all',
    title: ''
  });
  const [ticketMessage, setTicketMessage] = useState('');
  const [chatMessage, setChatMessage] = useState('');

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const [analyticsRes, ticketsRes, chatsRes, faqsRes, cannedRes, rulesRes] = await Promise.all([
        adminAPI.getSupportAnalytics({}),
        adminAPI.getTickets({}),
        adminAPI.getSupportChats({}),
        adminAPI.getFAQs({}),
        adminAPI.getCannedResponses({}),
        adminAPI.getAutoReplyRules({})
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
      setLoading(false);
    } catch (err) {
      console.error('Error fetching support data:', err);
      setLoading(false);
    }
  };

  const handleCreateTicket = async () => {
    try {
      await adminAPI.createTicket(newTicket);
      toast.success('Ticket created successfully');
      setShowTicketModal(false);
      setNewTicket({
        userId: '',
        category: 'other',
        priority: 'medium',
        subject: '',
        description: ''
      });
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to create ticket');
    }
  };

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      await adminAPI.updateTicket(ticketId, updates);
      toast.success('Ticket updated successfully');
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to update ticket');
    }
  };

  const handleAddTicketMessage = async (ticketId) => {
    try {
      await adminAPI.addTicketMessage(ticketId, ticketMessage, false, []);
      toast.success('Message added');
      setTicketMessage('');
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to add message');
    }
  };

  const handleResolveTicket = async (ticketId) => {
    try {
      await adminAPI.resolveTicket(ticketId, 'Resolved by admin', 5, 'Good service');
      toast.success('Ticket resolved');
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to resolve ticket');
    }
  };

  const handleCreateFAQ = async () => {
    try {
      await adminAPI.createFAQ(newFAQ);
      toast.success('FAQ created successfully');
      setShowFAQModal(false);
      setNewFAQ({
        title: '',
        content: '',
        category: 'getting_started',
        tags: [],
        language: 'en'
      });
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to create FAQ');
    }
  };

  const handleCreateCannedResponse = async () => {
    try {
      await adminAPI.createCannedResponse(newCannedResponse);
      toast.success('Canned response created');
      setShowCannedModal(false);
      setNewCannedResponse({
        title: '',
        content: '',
        category: 'greeting',
        tags: [],
        language: 'en'
      });
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to create canned response');
    }
  };

  const handleCreateAutoReplyRule = async () => {
    try {
      await adminAPI.createAutoReplyRule(newAutoReplyRule);
      toast.success('Auto reply rule created');
      setShowAutoReplyModal(false);
      setNewAutoReplyRule({
        name: '',
        trigger: '',
        triggerType: 'category',
        action: 'auto_reply',
        response: { message: '' },
        category: 'other',
        priority: 'medium'
      });
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to create auto reply rule');
    }
  };

  const handleSendBroadcast = async () => {
    try {
      await adminAPI.sendBroadcastMessage(broadcastMessage.message, broadcastMessage.targetAudience, broadcastMessage.title);
      toast.success('Broadcast sent successfully');
      setShowBroadcastModal(false);
      setBroadcastMessage({
        message: '',
        targetAudience: 'all',
        title: ''
      });
    } catch (err) {
      toast.error('Failed to send broadcast');
    }
  };

  const handleDeleteFAQ = async (faqId) => {
    try {
      await adminAPI.deleteFAQ(faqId);
      toast.success('FAQ deleted');
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to delete FAQ');
    }
  };

  const handleDeleteCannedResponse = async (responseId) => {
    try {
      await adminAPI.deleteCannedResponse(responseId);
      toast.success('Canned response deleted');
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to delete canned response');
    }
  };

  const handleDeleteAutoReplyRule = async (ruleId) => {
    try {
      await adminAPI.deleteAutoReplyRule(ruleId);
      toast.success('Auto reply rule deleted');
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to delete auto reply rule');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#22c55e';
      case 'in_progress': return '#eab308';
      case 'waiting': return '#f97316';
      case 'resolved': return '#3b82f6';
      case 'closed': return '#6b7280';
      case 'active': return '#22c55e';
      case 'transferred': return '#f97316';
      case 'ended': return '#6b7280';
      default: return '#6b7280';
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
        <div className="loading-spinner">Loading support data...</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <div className="admin-header-left">
          <div className="admin-greeting">
            <FaHeadset /> {t('admin.supportDashboard') || 'Support System'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="btn btn-primary" onClick={() => setShowBroadcastModal(true)}>
            <FaBell /> {t('admin.broadcast') || 'Broadcast'}
          </button>
          <button className="admin-icon-btn" onClick={fetchSupportData}>
            <FaSearch />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-tabs">
        <button
          className={`admin-tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <FaTachometerAlt /> {t('admin.overview') || 'Overview'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <FaTicketAlt /> {t('admin.tickets') || 'Tickets'} ({tickets.filter(t => t.status !== 'closed').length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'chats' ? 'active' : ''}`}
          onClick={() => setActiveTab('chats')}
        >
          <FaComments /> {t('admin.liveChat') || 'Live Chat'} ({chats.filter(c => c.status === 'active').length})
        </button>
        <button
          className={`admin-tab ${activeTab === 'faqs' ? 'active' : ''}`}
          onClick={() => setActiveTab('faqs')}
        >
          <FaBook /> {t('admin.knowledgeBase') || 'Knowledge Base'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'canned' ? 'active' : ''}`}
          onClick={() => setActiveTab('canned')}
        >
          <FaReply /> {t('admin.cannedResponses') || 'Canned Responses'}
        </button>
        <button
          className={`admin-tab ${activeTab === 'auto' ? 'active' : ''}`}
          onClick={() => setActiveTab('auto')}
        >
          <FaRobot /> {t('admin.autoReplies') || 'Auto Replies'}
        </button>
      </div>

      {/* Overview Tab */}
      {activeTab === 'overview' && analytics && (
        <div className="admin-content">
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaTicketAlt />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.tickets?.total || 0}</div>
                <div className="admin-stat-label">{t('admin.totalTickets') || 'Total Tickets'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(234, 179, 8, 0.08)', color: '#eab308' }}>
                <FaHourglassHalf />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.tickets?.open || 0}</div>
                <div className="admin-stat-label">{t('admin.openTickets') || 'Open Tickets'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaCheckCircle />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.tickets?.resolved || 0}</div>
                <div className="admin-stat-label">{t('admin.resolvedTickets') || 'Resolved'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(249, 115, 22, 0.08)', color: '#f97316' }}>
                <FaClock />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.performance?.avgResponseTime || 0}m</div>
                <div className="admin-stat-label">{t('admin.avgResponseTime') || 'Avg Response'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(34, 197, 94, 0.08)', color: '#22c55e' }}>
                <FaStar />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.performance?.avgSatisfaction || 0}</div>
                <div className="admin-stat-label">{t('admin.satisfaction') || 'Satisfaction'}</div>
              </div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
                <FaComments />
              </div>
              <div>
                <div className="admin-stat-value">{analytics.chats?.active || 0}</div>
                <div className="admin-stat-label">{t('admin.activeChats') || 'Active Chats'}</div>
              </div>
            </div>
          </div>

          <div className="admin-section">
            <h3><FaTicketAlt /> {t('admin.ticketsByCategory') || 'Tickets by Category'}</h3>
            <div className="admin-list">
              {analytics.tickets?.byCategory?.map((cat, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{cat._id}</span>
                    <span className="item-meta">{cat.count} tickets</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-section">
            <h3><FaBook /> {t('admin.popularFAQs') || 'Popular FAQs'}</h3>
            <div className="admin-list">
              {(analytics.faqs?.popular || []).slice(0, 5).map((faq, idx) => (
                <div key={idx} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{faq.title}</span>
                    <span className="item-meta">{faq.views} views</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Tickets Tab */}
      {activeTab === 'tickets' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaTicketAlt /> {t('admin.tickets') || 'Tickets'}</h3>
            <button className="btn btn-primary" onClick={() => setShowTicketModal(true)}>
              <FaPlus /> {t('admin.createTicket') || 'Create Ticket'}
            </button>
          </div>
          <div className="admin-list">
            {tickets.length === 0 ? (
              <div className="empty-state">No tickets</div>
            ) : (
              tickets.map(ticket => (
                <div key={ticket._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{ticket.ticketNumber}</span>
                    <span className="item-meta">{ticket.subject}</span>
                    <span className="item-meta" style={{ color: getStatusColor(ticket.status) }}>
                      {ticket.status}
                    </span>
                    <span className="item-meta" style={{ color: getPriorityColor(ticket.priority) }}>
                      {ticket.priority}
                    </span>
                  </div>
                  <div className="item-actions">
                    {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                      <>
                        <button
                          className="btn btn-sm"
                          style={{ background: '#22c55e' }}
                          onClick={() => handleResolveTicket(ticket._id)}
                        >
                          <FaCheckCircle /> Resolve
                        </button>
                        <button
                          className="btn btn-sm"
                          onClick={() => setSelectedTicket(ticket)}
                        >
                          <FaEye /> View
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Chats Tab */}
      {activeTab === 'chats' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaComments /> {t('admin.liveChat') || 'Live Chat'}</h3>
          </div>
          <div className="admin-list">
            {chats.length === 0 ? (
              <div className="empty-state">No active chats</div>
            ) : (
              chats.map(chat => (
                <div key={chat._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{chat.participants?.[0]?.user?.firstName || 'Unknown'}</span>
                    <span className="item-meta">{chat.messages?.length || 0} messages</span>
                    <span className="item-meta" style={{ color: getStatusColor(chat.status) }}>
                      {chat.status}
                    </span>
                  </div>
                  <div className="item-actions">
                    {chat.status === 'active' && (
                      <button
                        className="btn btn-sm"
                        onClick={() => setSelectedChat(chat)}
                      >
                        <FaComments /> Join Chat
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* FAQs Tab */}
      {activeTab === 'faqs' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaBook /> {t('admin.knowledgeBase') || 'Knowledge Base'}</h3>
            <button className="btn btn-primary" onClick={() => setShowFAQModal(true)}>
              <FaPlus /> {t('admin.createFAQ') || 'Create FAQ'}
            </button>
          </div>
          <div className="admin-list">
            {faqs.length === 0 ? (
              <div className="empty-state">No FAQs</div>
            ) : (
              faqs.map(faq => (
                <div key={faq._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{faq.title}</span>
                    <span className="item-meta">{faq.category}</span>
                    <span className="item-meta">{faq.views} views</span>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn btn-sm"
                      style={{ background: '#dc2626' }}
                      onClick={() => handleDeleteFAQ(faq._id)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Canned Responses Tab */}
      {activeTab === 'canned' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaReply /> {t('admin.cannedResponses') || 'Canned Responses'}</h3>
            <button className="btn btn-primary" onClick={() => setShowCannedModal(true)}>
              <FaPlus /> {t('admin.createResponse') || 'Create Response'}
            </button>
          </div>
          <div className="admin-list">
            {cannedResponses.length === 0 ? (
              <div className="empty-state">No canned responses</div>
            ) : (
              cannedResponses.map(response => (
                <div key={response._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{response.title}</span>
                    <span className="item-meta">{response.category}</span>
                    <span className="item-meta">{response.useCount} uses</span>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn btn-sm"
                      style={{ background: '#dc2626' }}
                      onClick={() => handleDeleteCannedResponse(response._id)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Auto Replies Tab */}
      {activeTab === 'auto' && (
        <div className="admin-content">
          <div className="admin-section-header">
            <h3><FaRobot /> {t('admin.autoReplies') || 'Auto Reply Rules'}</h3>
            <button className="btn btn-primary" onClick={() => setShowAutoReplyModal(true)}>
              <FaPlus /> {t('admin.createRule') || 'Create Rule'}
            </button>
          </div>
          <div className="admin-list">
            {autoReplyRules.length === 0 ? (
              <div className="empty-state">No auto reply rules</div>
            ) : (
              autoReplyRules.map(rule => (
                <div key={rule._id} className="admin-list-item">
                  <div className="item-info">
                    <span className="item-name">{rule.name}</span>
                    <span className="item-meta">{rule.triggerType}: {rule.trigger}</span>
                    <span className="item-meta">{rule.action}</span>
                  </div>
                  <div className="item-actions">
                    <button
                      className="btn btn-sm"
                      style={{ background: '#dc2626' }}
                      onClick={() => handleDeleteAutoReplyRule(rule._id)}
                    >
                      <FaTrash /> Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Create Ticket Modal */}
      {showTicketModal && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.createTicket') || 'Create Ticket'}</h3>
              <button className="modal-close" onClick={() => setShowTicketModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label>User ID</label>
                <input
                  type="text"
                  value={newTicket.userId}
                  onChange={(e) => setNewTicket({ ...newTicket, userId: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                  placeholder="Enter user ID"
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Category</label>
                <select
                  value={newTicket.category}
                  onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                >
                  <option value="payment">Payment</option>
                  <option value="trip">Trip</option>
                  <option value="account">Account</option>
                  <option value="app">App</option>
                  <option value="safety">Safety</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Priority</label>
                <select
                  value={newTicket.priority}
                  onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                >
                  <option value="urgent">Urgent</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Subject</label>
                <input
                  type="text"
                  value={newTicket.subject}
                  onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                  placeholder="Enter subject"
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Description</label>
                <textarea
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8, minHeight: '100px' }}
                  placeholder="Describe the issue..."
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleCreateTicket}
              >
                <FaTicketAlt /> Create Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create FAQ Modal */}
      {showFAQModal && (
        <div className="modal-overlay" onClick={() => setShowFAQModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.createFAQ') || 'Create FAQ'}</h3>
              <button className="modal-close" onClick={() => setShowFAQModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label>Title</label>
                <input
                  type="text"
                  value={newFAQ.title}
                  onChange={(e) => setNewFAQ({ ...newFAQ, title: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                  placeholder="Enter FAQ title"
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Category</label>
                <select
                  value={newFAQ.category}
                  onChange={(e) => setNewFAQ({ ...newFAQ, category: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                >
                  <option value="getting_started">Getting Started</option>
                  <option value="account">Account</option>
                  <option value="payment">Payment</option>
                  <option value="trips">Trips</option>
                  <option value="driver">Driver</option>
                  <option value="safety">Safety</option>
                  <option value="technical">Technical</option>
                  <option value="billing">Billing</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Content</label>
                <textarea
                  value={newFAQ.content}
                  onChange={(e) => setNewFAQ({ ...newFAQ, content: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8, minHeight: '150px' }}
                  placeholder="Enter FAQ content..."
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleCreateFAQ}
              >
                <FaBook /> Create FAQ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Canned Response Modal */}
      {showCannedModal && (
        <div className="modal-overlay" onClick={() => setShowCannedModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.createResponse') || 'Create Canned Response'}</h3>
              <button className="modal-close" onClick={() => setShowCannedModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label>Title</label>
                <input
                  type="text"
                  value={newCannedResponse.title}
                  onChange={(e) => setNewCannedResponse({ ...newCannedResponse, title: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                  placeholder="Enter response title"
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Category</label>
                <select
                  value={newCannedResponse.category}
                  onChange={(e) => setNewCannedResponse({ ...newCannedResponse, category: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                >
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
                <label>Content</label>
                <textarea
                  value={newCannedResponse.content}
                  onChange={(e) => setNewCannedResponse({ ...newCannedResponse, content: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8, minHeight: '100px' }}
                  placeholder="Enter response content..."
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleCreateCannedResponse}
              >
                <FaReply /> Create Response
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Auto Reply Rule Modal */}
      {showAutoReplyModal && (
        <div className="modal-overlay" onClick={() => setShowAutoReplyModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.createRule') || 'Create Auto Reply Rule'}</h3>
              <button className="modal-close" onClick={() => setShowAutoReplyModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label>Rule Name</label>
                <input
                  type="text"
                  value={newAutoReplyRule.name}
                  onChange={(e) => setNewAutoReplyRule({ ...newAutoReplyRule, name: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                  placeholder="Enter rule name"
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Trigger Type</label>
                <select
                  value={newAutoReplyRule.triggerType}
                  onChange={(e) => setNewAutoReplyRule({ ...newAutoReplyRule, triggerType: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                >
                  <option value="category">Category</option>
                  <option value="priority">Priority</option>
                  <option value="keyword">Keyword</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Trigger</label>
                <input
                  type="text"
                  value={newAutoReplyRule.trigger}
                  onChange={(e) => setNewAutoReplyRule({ ...newAutoReplyRule, trigger: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                  placeholder="Enter trigger value"
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Action</label>
                <select
                  value={newAutoReplyRule.action}
                  onChange={(e) => setNewAutoReplyRule({ ...newAutoReplyRule, action: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                >
                  <option value="auto_reply">Auto Reply</option>
                  <option value="auto_escalate">Auto Escalate</option>
                  <option value="auto_assign">Auto Assign</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Response Message</label>
                <textarea
                  value={newAutoReplyRule.response.message}
                  onChange={(e) => setNewAutoReplyRule({ ...newAutoReplyRule, response: { ...newAutoReplyRule.response, message: e.target.value } })}
                  style={{ width: '100%', padding: '12px', marginTop: 8, minHeight: '80px' }}
                  placeholder="Enter auto-reply message..."
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleCreateAutoReplyRule}
              >
                <FaRobot /> Create Rule
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastModal && (
        <div className="modal-overlay" onClick={() => setShowBroadcastModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.broadcast') || 'Send Broadcast'}</h3>
              <button className="modal-close" onClick={() => setShowBroadcastModal(false)}>
                <FaTimes />
              </button>
            </div>
            <div className="driver-detail">
              <div style={{ marginTop: 16 }}>
                <label>Title</label>
                <input
                  type="text"
                  value={broadcastMessage.title}
                  onChange={(e) => setBroadcastMessage({ ...broadcastMessage, title: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                  placeholder="Enter broadcast title"
                />
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Target Audience</label>
                <select
                  value={broadcastMessage.targetAudience}
                  onChange={(e) => setBroadcastMessage({ ...broadcastMessage, targetAudience: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8 }}
                >
                  <option value="all">All Users</option>
                  <option value="drivers">Drivers Only</option>
                  <option value="passengers">Passengers Only</option>
                </select>
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Message</label>
                <textarea
                  value={broadcastMessage.message}
                  onChange={(e) => setBroadcastMessage({ ...broadcastMessage, message: e.target.value })}
                  style={{ width: '100%', padding: '12px', marginTop: 8, minHeight: '100px' }}
                  placeholder="Enter broadcast message..."
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={handleSendBroadcast}
              >
                <FaBell /> Send Broadcast
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {selectedTicket && (
        <div className="modal-overlay" onClick={() => setSelectedTicket(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{selectedTicket.ticketNumber}</h3>
              <button className="modal-close" onClick={() => setSelectedTicket(null)}>
                <FaTimes />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">Subject</span>
                <span className="detail-val">{selectedTicket.subject}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Status</span>
                <span className="detail-val" style={{ color: getStatusColor(selectedTicket.status) }}>
                  {selectedTicket.status}
                </span>
              </div>
              <div className="detail-row">
                <span className="detail-key">Priority</span>
                <span className="detail-val" style={{ color: getPriorityColor(selectedTicket.priority) }}>
                  {selectedTicket.priority}
                </span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label>Add Message</label>
                <textarea
                  value={ticketMessage}
                  onChange={(e) => setTicketMessage(e.target.value)}
                  style={{ width: '100%', padding: '12px', marginTop: 8, minHeight: '80px' }}
                  placeholder="Type your message..."
                />
              </div>
              <button
                className="btn btn-primary"
                style={{ marginTop: 16 }}
                onClick={() => handleAddTicketMessage(selectedTicket._id)}
              >
                <FaPaperPlane /> Send Message
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportDashboard;
