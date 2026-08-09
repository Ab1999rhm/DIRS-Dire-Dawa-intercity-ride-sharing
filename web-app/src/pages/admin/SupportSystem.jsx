import React, { useState, useEffect } from 'react';
import {
  FaHeadset, FaTicketAlt, FaComments, FaQuestionCircle, FaSearch, FaFilter,
  FaEye, FaCheckCircle, FaTimesCircle, FaClock, FaUser, FaReply,
  FaPaperPlane, FaRobot, FaBook, FaPlus, FaEdit, FaTrash, FaArchive, FaExclamationTriangle
} from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { adminAPI } from '../../services/api';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const SupportSystem = () => {
  const { t } = useLanguage();
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showTicketModal, setShowTicketModal] = useState(false);
  const [showFAQModal, setShowFAQModal] = useState(false);
  const [responseText, setResponseText] = useState('');
  const [activeTab, setActiveTab] = useState('tickets');

  useEffect(() => {
    fetchSupportData();
  }, []);

  const fetchSupportData = async () => {
    try {
      const res = await adminAPI.getSupportTickets();
      const d = res.data; setTickets(Array.isArray(d) ? d : (d?.data || d?.tickets || []));
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch support data:', err);
      // Use mock data as fallback
      setTickets([
        { id: 'TKT001', userId: 'Sara Tesfaye', subject: 'Payment not processed', status: 'open', priority: 'urgent', message: 'My payment was deducted but trip not confirmed', createdAt: new Date().toISOString() },
        { id: 'TKT002', userId: 'Bekele Alemu', subject: 'Driver behavior issue', status: 'in_progress', priority: 'high', message: 'Driver was rude and took wrong route', createdAt: new Date().toISOString() },
        { id: 'TKT003', userId: 'Helen Mengistu', subject: 'App crash during booking', status: 'open', priority: 'medium', message: 'App crashed when I tried to book a ride', createdAt: new Date().toISOString() },
        { id: 'TKT004', userId: 'Dawit Kebede', subject: 'Refund request', status: 'resolved', priority: 'low', message: 'Need refund for cancelled trip', createdAt: new Date().toISOString() },
        { id: 'TKT005', userId: 'Kalkidan Zewde', subject: 'Account verification issue', status: 'open', priority: 'medium', message: 'Cannot verify my phone number', createdAt: new Date().toISOString() },
      ]);
      setLoading(false);
    }
  };

  const handleUpdateTicket = async (ticketId, status, response) => {
    try {
      await adminAPI.updateTicket(ticketId, status, response);
      toast.success('Ticket updated successfully');
      setShowTicketModal(false);
      setResponseText('');
      fetchSupportData();
    } catch (err) {
      toast.error('Failed to update ticket');
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesStatus = filterStatus === 'all' || ticket.status === filterStatus;
    const matchesPriority = filterPriority === 'all' || ticket.priority === filterPriority;
    const matchesSearch = ticket.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.userId?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         ticket.subject?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesPriority && matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'open': return '#3b82f6';
      case 'in_progress': return '#f59e0b';
      case 'resolved': return '#10b981';
      case 'closed': return '#6b7280';
      default: return '#3b82f6';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return '#ef4444';
      case 'high': return '#f59e0b';
      case 'medium': return '#3b82f6';
      case 'low': return '#10b981';
      default: return '#6b7280';
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
            {t('admin.supportSystem') || 'Support System'}
          </div>
          <div className="admin-role-badge">
            <FaHeadset /> {t('admin.support') || 'Support'}
          </div>
        </div>
        <div className="admin-header-actions">
          <button className="admin-icon-btn" onClick={fetchSupportData}>
            <FaSearch />
          </button>
          <button
            className="btn btn-primary btn-sm"
            onClick={() => setShowFAQModal(true)}
          >
            <FaBook /> {t('admin.manageFAQ') || 'Manage FAQ'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="admin-filter-tabs">
        <button
          className={`admin-filter-tab ${activeTab === 'tickets' ? 'active' : ''}`}
          onClick={() => setActiveTab('tickets')}
        >
          <FaTicketAlt /> {t('admin.tickets') || 'Tickets'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'chat' ? 'active' : ''}`}
          onClick={() => setActiveTab('chat')}
        >
          <FaComments /> {t('admin.liveChat') || 'Live Chat'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'faq' ? 'active' : ''}`}
          onClick={() => setActiveTab('faq')}
        >
          <FaQuestionCircle /> {t('admin.faq') || 'FAQ'}
        </button>
        <button
          className={`admin-filter-tab ${activeTab === 'automated' ? 'active' : ''}`}
          onClick={() => setActiveTab('automated')}
        >
          <FaRobot /> {t('admin.automatedResponses') || 'Automated Responses'}
        </button>
      </div>

      {/* Support Stats */}
      <div className="admin-stats-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(59, 130, 246, 0.08)', color: '#3b82f6' }}>
            <FaTicketAlt />
          </div>
          <div>
            <div className="admin-stat-value">{tickets.filter(t => t.status === 'open').length}</div>
            <div className="admin-stat-label">{t('admin.openTickets') || 'Open Tickets'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(245, 158, 11, 0.08)', color: '#f59e0b' }}>
            <FaClock />
          </div>
          <div>
            <div className="admin-stat-value">{tickets.filter(t => t.status === 'in_progress').length}</div>
            <div className="admin-stat-label">{t('admin.inProgress') || 'In Progress'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(16, 185, 129, 0.08)', color: '#10b981' }}>
            <FaCheckCircle />
          </div>
          <div>
            <div className="admin-stat-value">{tickets.filter(t => t.status === 'resolved').length}</div>
            <div className="admin-stat-label">{t('admin.resolved') || 'Resolved'}</div>
          </div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-icon" style={{ background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444' }}>
            <FaExclamationTriangle />
          </div>
          <div>
            <div className="admin-stat-value">{tickets.filter(t => t.priority === 'urgent').length}</div>
            <div className="admin-stat-label">{t('admin.urgent') || 'Urgent'}</div>
          </div>
        </div>
      </div>

      {activeTab === 'tickets' && (
        <>
          {/* Search and Filter */}
          <div className="admin-search">
            <FaSearch />
            <input
              type="text"
              placeholder={t('admin.searchTickets') || 'Search tickets...'}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="admin-filter-tabs">
            <button
              className={`admin-filter-tab ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
            >
              {t('admin.all') || 'All'}
            </button>
            <button
              className={`admin-filter-tab ${filterStatus === 'open' ? 'active' : ''}`}
              onClick={() => setFilterStatus('open')}
            >
              {t('admin.open') || 'Open'}
            </button>
            <button
              className={`admin-filter-tab ${filterStatus === 'in_progress' ? 'active' : ''}`}
              onClick={() => setFilterStatus('in_progress')}
            >
              {t('admin.inProgress') || 'In Progress'}
            </button>
            <button
              className={`admin-filter-tab ${filterStatus === 'resolved' ? 'active' : ''}`}
              onClick={() => setFilterStatus('resolved')}
            >
              {t('admin.resolved') || 'Resolved'}
            </button>
          </div>

          <div className="admin-filter-tabs">
            <button
              className={`admin-filter-tab ${filterPriority === 'all' ? 'active' : ''}`}
              onClick={() => setFilterPriority('all')}
            >
              {t('admin.allPriorities') || 'All Priorities'}
            </button>
            <button
              className={`admin-filter-tab ${filterPriority === 'urgent' ? 'active' : ''}`}
              onClick={() => setFilterPriority('urgent')}
            >
              {t('admin.urgent') || 'Urgent'}
            </button>
            <button
              className={`admin-filter-tab ${filterPriority === 'high' ? 'active' : ''}`}
              onClick={() => setFilterPriority('high')}
            >
              {t('admin.high') || 'High'}
            </button>
            <button
              className={`admin-filter-tab ${filterPriority === 'medium' ? 'active' : ''}`}
              onClick={() => setFilterPriority('medium')}
            >
              {t('admin.medium') || 'Medium'}
            </button>
          </div>

          {/* Tickets List */}
          <div className="admin-section-title">
            <FaTicketAlt /> {t('admin.supportTickets') || 'Support Tickets'}
          </div>
          <div className="admin-activity-list">
            {filteredTickets.map((ticket) => (
              <div key={ticket.id} className="admin-activity-item">
                <div className="admin-activity-icon" style={{
                  background: 'rgba(59, 130, 246, 0.08)',
                  color: getStatusColor(ticket.status)
                }}>
                  <FaTicketAlt />
                </div>
                <div className="admin-activity-info">
                  <div className="admin-activity-text">{ticket.subject}</div>
                  <div className="admin-activity-time">
                    {ticket.userId} • {new Date(ticket.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div className="status-badge" style={{
                    background: ticket.priority === 'urgent' ? '#fef2f2' :
                             ticket.priority === 'high' ? '#fef3c7' :
                             ticket.priority === 'medium' ? '#dbeafe' : '#dcfce7',
                    color: ticket.priority === 'urgent' ? '#dc2626' :
                           ticket.priority === 'high' ? '#92400e' :
                           ticket.priority === 'medium' ? '#1d4ed8' : '#15803d'
                  }}>
                    {ticket.priority}
                  </div>
                  <button
                    className="admin-icon-btn"
                    style={{ width: 32, height: 32 }}
                    onClick={() => {
                      setSelectedTicket(ticket);
                      setShowTicketModal(true);
                    }}
                  >
                    <FaEye />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {activeTab === 'chat' && (
        <div className="admin-empty" style={{ padding: '60px 20px' }}>
          <div className="admin-empty-icon">
            <FaComments />
          </div>
          <h3>{t('admin.liveChat') || 'Live Chat'}</h3>
          <p>{t('admin.liveChatDescription') || 'Real-time chat with users will appear here'}</p>
        </div>
      )}

      {activeTab === 'faq' && (
        <div className="admin-empty" style={{ padding: '60px 20px' }}>
          <div className="admin-empty-icon">
            <FaQuestionCircle />
          </div>
          <h3>{t('admin.faqManagement') || 'FAQ Management'}</h3>
          <p>{t('admin.faqDescription') || 'Manage frequently asked questions'}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }}>
            <FaPlus /> {t('admin.addFAQ') || 'Add FAQ'}
          </button>
        </div>
      )}

      {activeTab === 'automated' && (
        <div className="admin-empty" style={{ padding: '60px 20px' }}>
          <div className="admin-empty-icon">
            <FaRobot />
          </div>
          <h3>{t('admin.automatedResponses') || 'Automated Responses'}</h3>
          <p>{t('admin.automatedDescription') || 'Configure automated response rules'}</p>
          <button className="btn btn-primary" style={{ marginTop: 16 }}>
            <FaPlus /> {t('admin.addRule') || 'Add Rule'}
          </button>
        </div>
      )}

      {/* Ticket Detail Modal */}
      {showTicketModal && selectedTicket && (
        <div className="modal-overlay" onClick={() => setShowTicketModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{t('admin.ticketDetails') || 'Ticket Details'}</h3>
              <button className="modal-close" onClick={() => setShowTicketModal(false)}>
                <FaTimesCircle />
              </button>
            </div>
            <div className="driver-detail">
              <div className="detail-row">
                <span className="detail-key">{t('admin.ticketId')}</span>
                <span className="detail-val">{selectedTicket.id}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.user')}</span>
                <span className="detail-val">{selectedTicket.userId}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.subject')}</span>
                <span className="detail-val">{selectedTicket.subject}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.status')}</span>
                <span className="detail-val">{selectedTicket.status}</span>
              </div>
              <div className="detail-row">
                <span className="detail-key">{t('admin.priority')}</span>
                <span className="detail-val">{selectedTicket.priority}</span>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.message') || 'Message'}
                </label>
                <div style={{
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  fontSize: '14px',
                  minHeight: '80px'
                }}>
                  {selectedTicket.message}
                </div>
              </div>
              <div style={{ marginTop: 16 }}>
                <label style={{ fontSize: 13, fontWeight: 600, marginBottom: 8, display: 'block' }}>
                  {t('admin.response') || 'Your Response'}
                </label>
                <textarea
                  value={responseText}
                  onChange={(e) => setResponseText(e.target.value)}
                  placeholder={t('admin.enterResponse') || 'Enter your response...'}
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
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button
                  className="btn btn-primary"
                  onClick={() => handleUpdateTicket(selectedTicket.id, 'in_progress', responseText)}
                >
                  <FaReply /> {t('admin.respond') || 'Respond'}
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: '#10b981' }}
                  onClick={() => handleUpdateTicket(selectedTicket.id, 'resolved', responseText)}
                >
                  <FaCheckCircle /> {t('admin.resolve') || 'Resolve'}
                </button>
                <button
                  className="btn btn-danger"
                  onClick={() => handleUpdateTicket(selectedTicket.id, 'closed', responseText)}
                >
                  <FaArchive /> {t('admin.close') || 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportSystem;
