import React, { useState, useEffect, useCallback } from 'react';
import { FaEye, FaBan, FaSearch, FaFilter } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import Modal from '../../components/common/Modal';
import Badge, { StatusBadge } from '../../components/common/Badge';
import './Admin.css';

const AdminUsers = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.users();
      setUsers(res.data.users || res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = !searchQuery ||
      u.firstName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.lastName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phoneNumber?.includes(searchQuery);
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const handleSuspend = async (userId) => {
    try {
      await adminAPI.suspendUser(userId, 'Suspended by admin');
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'suspended' } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to suspend user');
    }
  };

  const handleReactivate = async (userId) => {
    try {
      await adminAPI.reactivateUser(userId);
      setUsers(prev => prev.map(u => u._id === userId ? { ...u, status: 'active' } : u));
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reactivate user');
    }
  };

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>{t('admin.users')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-page">
        <div className="admin-header"><h1>{t('admin.users')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--danger)' }}>{error}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{t('admin.users')}</h1>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
          <FaSearch style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search users..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 36px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 14 }}
          />
        </div>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          style={{ padding: '10px 12px', border: '1px solid var(--border-light)', borderRadius: 8, fontSize: 14, background: '#fff' }}
        >
          <option value="all">All Roles</option>
          <option value="passenger">Passenger</option>
          <option value="driver">Driver</option>
        </select>
      </div>

      {filteredUsers.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <EmptyStateIllustration type="users" />
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>No users found</h3>
          <p style={{ color: 'var(--text-muted)' }}>No users match your search criteria</p>
        </div>
      ) : (
        <div className="admin-table">
          <div className="admin-table-header">
            <div style={{ gridColumn: 'span 2' }}>User</div>
            <div>Phone</div>
            <div>Role</div>
            <div>Status</div>
            <div style={{ gridColumn: 'span 2', textAlign: 'right' }}>Actions</div>
          </div>
          {filteredUsers.map((u) => (
            <div key={u._id} className="admin-table-row">
              <div className="row-main">
                <div className="row-avatar">
                  {u.firstName?.[0]}{u.lastName?.[0]}
                </div>
                <div className="row-info">
                  <h4>{u.firstName} {u.lastName}</h4>
                  <p>Joined {new Date(u.createdAt).toLocaleDateString()}</p>
                </div>
              </div>
              <div>{u.phoneNumber}</div>
              <div><Badge variant={u.role === 'driver' ? 'success' : u.role === 'admin' ? 'warning' : 'primary'}>{u.role}</Badge></div>
              <div><StatusBadge status={u.status || 'active'} /></div>
              <div className="row-actions">
                <button className="btn btn-ghost btn-sm" onClick={() => { setSelectedUser(u); setShowModal(true); }}>
                  <FaEye /> View
                </button>
                {u.status !== 'suspended' ? (
                  <button className="btn btn-danger btn-sm" onClick={() => handleSuspend(u._id)}>
                    <FaBan /> {t('admin.suspend')}
                  </button>
                ) : (
                  <button className="btn btn-success btn-sm" onClick={() => handleReactivate(u._id)}>
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="User Details">
        {selectedUser && (
          <div className="detail-modal-content">
            <div className="detail-row"><span className="detail-key">Name</span><span className="detail-val">{selectedUser.firstName} {selectedUser.lastName}</span></div>
            <div className="detail-row"><span className="detail-key">Phone</span><span className="detail-val">{selectedUser.phoneNumber}</span></div>
            <div className="detail-row"><span className="detail-key">Role</span><span className="detail-val">{selectedUser.role}</span></div>
            <div className="detail-row"><span className="detail-key">Status</span><span className="detail-val">{selectedUser.status || 'active'}</span></div>
            <div className="detail-row"><span className="detail-key">Email</span><span className="detail-val">{selectedUser.email || 'N/A'}</span></div>
            <div className="detail-row"><span className="detail-key">Joined</span><span className="detail-val">{new Date(selectedUser.createdAt).toLocaleDateString()}</span></div>
            <div className="detail-row"><span className="detail-key">ID</span><span className="detail-val" style={{ fontSize: 11 }}>{selectedUser._id}</span></div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminUsers;
