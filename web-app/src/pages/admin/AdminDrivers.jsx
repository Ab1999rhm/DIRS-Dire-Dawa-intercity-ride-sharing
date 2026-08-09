import React, { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaCar, FaStar, FaEye, FaFileImage, FaSearch, FaFilter } from 'react-icons/fa';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { adminAPI } from '../../services/api';
import { EmptyStateIllustration } from '../../components/common/Backgrounds';
import Badge, { StatusBadge } from '../../components/common/Badge';
import { useToast } from '../../components/common/Toast';
import './Admin.css';

const REJECTION_REASONS = [
  'License is expired',
  'Blurry / unreadable photo',
  'Vehicle insurance expired',
  'Plate number mismatch',
  'Driver is below minimum age',
  'Invalid police clearance record',
  'Vehicle in poor condition',
  'Other (custom)',
];

// Mock documents per driver
const MOCK_DOCS = {
  default: [
    { title: 'Driving License', status: 'verified', fileIcon: '🪪' },
    { title: 'Vehicle Libre (Bolo)', status: 'pending', fileIcon: '📄' },
    { title: 'Commercial Insurance', status: 'pending', fileIcon: '📋' },
    { title: 'Police Clearance', status: 'verified', fileIcon: '🛡️' },
  ]
};

const AdminDrivers = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const toast = useToast();
  const [drivers, setDrivers] = useState([]);
  const [driverStats, setDriverStats] = useState({ total: 0, pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Document Inspection Drawer state
  const [inspectDriver, setInspectDriver] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchDrivers('all');
  }, []);

  const handleFilterChange = (status) => {
    setFilterStatus(status);
    fetchDrivers(status);
  };

  const fetchDrivers = async (statusFilter) => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter && statusFilter !== 'all') params.status = statusFilter;
      const res = await adminAPI.drivers(params);
      const list = (res.data.drivers || res.data || []).map(d => ({
        ...d,
        firstName: d.firstName || d.user?.firstName || '',
        lastName: d.lastName || d.user?.lastName || '',
        phoneNumber: d.phoneNumber || d.user?.phoneNumber || '',
        email: d.email || d.user?.email || '',
        profilePhoto: d.profilePhoto || d.user?.profilePhoto || '',
        isOnline: d.isOnline || d.user?.isOnline || false,
      }));
      setDrivers(list);
      if (res.data.stats) setDriverStats(res.data.stats);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load drivers');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (driverId, action, reason) => {
    setSubmitting(true);
    try {
      await adminAPI.verifyDriver(driverId, action);
      setDrivers(prev => prev.map(d =>
        d._id === driverId
          ? { ...d, verificationStatus: action === 'approve' ? 'approved' : 'rejected' }
          : d
      ));
      toast.success(`Driver ${action === 'approve' ? 'approved ✅' : `rejected — "${reason}"`}`);
      setInspectDriver(null);
    } catch (err) {
      toast.error(err.response?.data?.message || `Failed to ${action} driver`);
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveFromDrawer = () => handleVerify(inspectDriver._id, 'approve', '');
  const handleRejectFromDrawer = () => {
    const reason = rejectionReason === 'Other (custom)' ? customReason : rejectionReason;
    if (!reason) { toast.error('Please select a rejection reason'); return; }
    handleVerify(inspectDriver._id, 'reject', reason);
  };

  // Filtering
  const filtered = drivers.filter(d => {
    const matchStatus = filterStatus === 'all' || (d.verificationStatus || 'pending') === filterStatus;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      `${d.firstName} ${d.lastName}`.toLowerCase().includes(q) ||
      d.phoneNumber?.includes(q) ||
      d.vehicle?.plateNumber?.toLowerCase().includes(q);
    return matchStatus && matchSearch;
  });

  if (loading) {
    return (
      <div className="admin-page">
        <div className="admin-logo-bar">
          <img src="/logo.svg?v=2" alt="DIRS" className="admin-logo" />
        </div>
        <div className="admin-header"><h1>{t('admin.drivers')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-logo-bar">
        <img src="/logo.svg?v=2" alt="DIRS" className="admin-logo" />
      </div>
      <div className="admin-header admin-animate-in">
        <h1>{t('admin.drivers')}</h1>
        <button className="btn btn-primary" onClick={() => fetchDrivers(filterStatus)} style={{ fontSize: 13 }}>{t('common.refresh') || '🔄 Refresh'}</button>
      </div>

      {error && <div className="error-banner" onClick={() => setError(null)}>{error}</div>}

      {/* Search & Filter Bar */}
      <div className="admin-animate-in-delay-1" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--card)', border: '1px solid var(--border-light)', borderRadius: 8, padding: '8px 12px' }}>
          <FaSearch style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('admin.searchDrivers') || 'Search by name, phone, or plate...'}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            style={{ border: 'none', outline: 'none', fontSize: 13, width: '100%' }}
          />
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {['all', 'pending', 'approved', 'rejected'].map(s => (
            <button
              key={s}
              type="button"
              className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`}
              onClick={() => handleFilterChange(s)}
              style={{ textTransform: 'capitalize' }}
            >
              {t(`admin.${s}`) || s} ({s === 'all' ? driverStats.total : driverStats[s] || 0})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <EmptyStateIllustration type="users" />
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>{t('admin.noDrivers') || 'No drivers found'}</h3>
          <p style={{ color: 'var(--text-muted)' }}>{t('admin.adjustSearch') || 'Try adjusting your search or filter'}</p>
        </div>
      ) : (
        <div className="drivers-grid admin-animate-in-delay-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((driver) => {
            const docs = MOCK_DOCS[driver._id] || MOCK_DOCS.default;
            const pendingDocs = docs.filter(d => d.status === 'pending').length;
            return (
              <div key={driver._id} className="driver-verification-card" style={{ background: 'var(--card)', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid var(--border-light)' }}>
                {/* Driver Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, var(--primary), #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {driver.firstName?.[0]}{driver.lastName?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-primary)' }}>{driver.firstName} {driver.lastName}</h4>
                    <p style={{ margin: 0, fontSize: 12, color: 'var(--text-muted)' }}>{driver.phoneNumber}</p>
                  </div>
                  <StatusBadge status={driver.verificationStatus || 'pending'} />
                </div>

                {/* Vehicle Info */}
                {driver.vehicle && (
                  <div style={{ marginBottom: 12, padding: '10px 12px', background: 'var(--bg-secondary)', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <FaCar style={{ color: 'var(--primary)', fontSize: 12 }} />
                      <strong style={{ fontSize: 12, color: 'var(--text-primary)' }}>{driver.vehicle.make} {driver.vehicle.model} — {driver.vehicle.plateNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: 'var(--text-muted)' }}>
                      <span>Year: {driver.vehicle.year}</span>
                      <span>Color: {driver.vehicle.color}</span>
                      <span>Type: {driver.vehicle.type}</span>
                    </div>
                  </div>
                )}

                {/* Document Status Mini-Badges */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)' }}>{t('admin.documents') || 'Documents'}</span>
                    {pendingDocs > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: 'var(--warning-bg, #fef3c7)', color: 'var(--warning-text, #92400e)', padding: '1px 6px', borderRadius: 10 }}>
                        {pendingDocs} {t('admin.pendingReview') || 'Pending Review'}
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {docs.map((doc, idx) => (
                      <span key={idx} style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
                        background: doc.status === 'verified' ? 'var(--success-bg, #dcfce7)' : 'var(--warning-bg, #fef3c7)',
                        color: doc.status === 'verified' ? 'var(--success-text, #15803d)' : 'var(--warning-text, #b45309)'
                      }}>
                        {doc.fileIcon} {doc.title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rating & Trips */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12, color: 'var(--text-muted)' }}>
                  <span><FaStar style={{ color: 'var(--warning, #f59e0b)' }} /> {driver.rating?.average?.toFixed(1) || '0.0'}</span>
                  <span>🚗 {driver.totalTrips || 0} trips</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    style={{ flex: 1, padding: '8px', background: 'var(--bg-info, #eff6ff)', color: 'var(--primary)', border: '1px solid var(--border-info, #bfdbfe)', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                    onClick={() => { setInspectDriver(driver); setRejectionReason(''); setCustomReason(''); }}
                  >
                    <FaFileImage /> {t('admin.inspectDocs') || 'Inspect Docs'}
                  </button>
                  {(driver.verificationStatus === 'pending' || !driver.verificationStatus) && (
                    <>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleVerify(driver._id, 'approve', '')}
                      >
                        <FaCheck /> {t('admin.approve') || 'Approve'}
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => { setInspectDriver(driver); setRejectionReason('License is expired'); }}
                      >
                        <FaTimes /> {t('admin.reject') || 'Reject'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Document Inspection Drawer / Modal */}
      {inspectDriver && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', animation: 'fadeIn 0.2s ease' }} onClick={() => setInspectDriver(null)}>
          <div
            style={{ background: 'var(--card)', width: '100%', maxWidth: 600, borderRadius: '20px 20px 0 0', padding: 24, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)', animation: 'slideUp 0.3s ease' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Handle */}
            <div style={{ width: 40, height: 4, background: 'var(--border-light)', borderRadius: 2, margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>{t('admin.documentInspection') || '📋 Document Inspection'}</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: 'var(--text-muted)' }}>{inspectDriver.firstName} {inspectDriver.lastName} · {inspectDriver.phoneNumber}</p>
              </div>
              <StatusBadge status={inspectDriver.verificationStatus || 'pending'} />
            </div>

            {/* Documents Grid with Real Uploaded Image Display */}
            {(() => {
              const uploadedDocs = JSON.parse(localStorage.getItem('dirs_driver_documents') || '{}');
              const docList = [
                { key: 'licensePhoto', title: 'Driving License', fileIcon: '🪪' },
                { key: 'librePhoto', title: 'Vehicle Libre (Bolo)', fileIcon: '📄' },
                { key: 'insurancePhoto', title: 'Commercial Insurance', fileIcon: '📋' },
                { key: 'policeClearancePhoto', title: 'Police Clearance Record', fileIcon: '🛡️' }
              ];

              return (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12, marginBottom: 20 }}>
                  {docList.map(item => {
                    const docObj = uploadedDocs[item.key] || {};
                    const hasImage = Boolean(docObj.data);
                    const status = docObj.status || 'pending';

                    return (
                      <div key={item.key} style={{
                        border: `2px solid ${status === 'verified' ? 'var(--success, #86efac)' : hasImage ? 'var(--primary, #93c5fd)' : 'var(--warning, #fde68a)'}`,
                        borderRadius: 12,
                        padding: 14,
                        background: status === 'verified' ? 'var(--success-bg, #f0fdf4)' : hasImage ? 'var(--bg-info, #eff6ff)' : 'var(--warning-bg, #fffbeb)'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 22 }}>{item.fileIcon}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: status === 'verified' ? 'var(--success-bg, #dcfce7)' : 'var(--warning-bg, #fef3c7)',
                            color: status === 'verified' ? 'var(--success-text, #15803d)' : 'var(--warning-text, #b45309)'
                          }}>
                            {status === 'verified' ? (t('admin.verified') || '✅ VERIFIED') : hasImage ? (t('admin.uploadedReview') || '⏳ UPLOADED — REVIEW') : (t('admin.notUploaded') || '⚠️ NOT UPLOADED')}
                          </span>
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-primary)', marginBottom: 4 }}>{item.title}</div>

                        {/* Real Uploaded Photo Thumbnail */}
                        {hasImage ? (
                          <div style={{ borderRadius: 8, overflow: 'hidden', height: 120, background: 'var(--border-light)', margin: '8px 0', border: '1px solid var(--border-light)' }}>
                            <img src={docObj.data} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic', margin: '8px 0' }}>{t('admin.noImage') || 'No image file attached'}</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Rejection Reason Selector */}
            {(inspectDriver.verificationStatus === 'pending' || !inspectDriver.verificationStatus) && (
              <div style={{ background: 'var(--warning-bg, #fef9f0)', border: '1px solid var(--warning, #fde68a)', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: 'var(--warning-text, #92400e)' }}>{t('admin.rejectionReason') || '⚠️ Rejection Reason (required if rejecting)'}</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: rejectionReason === 'Other (custom)' ? 10 : 0 }}>
                  {REJECTION_REASONS.map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: rejectionReason === reason ? 'var(--danger)' : 'var(--card)',
                        color: rejectionReason === reason ? 'white' : 'var(--text-primary)',
                        border: `1px solid ${rejectionReason === reason ? 'var(--danger)' : 'var(--border-light)'}`
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                {rejectionReason === 'Other (custom)' && (
                  <input
                    type="text"
                    placeholder={t('admin.customReason') || 'Type custom rejection reason...'}
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-light)', fontSize: 13, marginTop: 8 }}
                  />
                )}
              </div>
            )}

            {/* Drawer Action Buttons */}
            {(inspectDriver.verificationStatus === 'pending' || !inspectDriver.verificationStatus) && (
              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleApproveFromDrawer}
                  style={{ flex: 1, padding: '12px', background: 'var(--success, #16a34a)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  ✅ {submitting ? (t('admin.approving') || 'Approving...') : (t('admin.approveDriver') || 'Approve Driver')}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleRejectFromDrawer}
                  style={{ flex: 1, padding: '12px', background: 'var(--danger, #dc2626)', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  ❌ {submitting ? (t('admin.rejecting') || 'Rejecting...') : (t('admin.rejectWithReason') || 'Reject with Reason')}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDrivers;
