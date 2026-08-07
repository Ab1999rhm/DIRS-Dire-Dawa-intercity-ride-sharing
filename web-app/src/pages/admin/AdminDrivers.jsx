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
    fetchDrivers();
  }, []);

  const fetchDrivers = async () => {
    try {
      setLoading(true);
      const res = await adminAPI.pendingDrivers();
      setDrivers(res.data.drivers || res.data || []);
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
        <div className="admin-header"><h1>{t('admin.drivers')}</h1></div>
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-muted)' }}>{t('common.loading')}</div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>{t('admin.drivers')}</h1>
        <button className="btn btn-primary" onClick={fetchDrivers} style={{ fontSize: 13 }}>🔄 Refresh</button>
      </div>

      {error && <div className="error-banner" onClick={() => setError(null)}>{error}</div>}

      {/* Search & Filter Bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 200, display: 'flex', alignItems: 'center', gap: 8, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 8, padding: '8px 12px' }}>
          <FaSearch style={{ color: '#94a3b8' }} />
          <input
            type="text"
            placeholder="Search by name, phone, or plate..."
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
              onClick={() => setFilterStatus(s)}
              style={{ textTransform: 'capitalize' }}
            >
              {s} ({s === 'all' ? drivers.length : drivers.filter(d => (d.verificationStatus || 'pending') === s).length})
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 40 }}>
          <EmptyStateIllustration type="users" />
          <h3 style={{ marginTop: 16, color: 'var(--text-secondary)' }}>No drivers found</h3>
          <p style={{ color: 'var(--text-muted)' }}>Try adjusting your search or filter</p>
        </div>
      ) : (
        <div className="drivers-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 16 }}>
          {filtered.map((driver) => {
            const docs = MOCK_DOCS[driver._id] || MOCK_DOCS.default;
            const pendingDocs = docs.filter(d => d.status === 'pending').length;
            return (
              <div key={driver._id} className="driver-verification-card" style={{ background: '#fff', borderRadius: 14, padding: 20, boxShadow: '0 1px 4px rgba(0,0,0,0.08)', border: '1px solid #f1f5f9' }}>
                {/* Driver Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'linear-gradient(135deg, #2563eb, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 16, flexShrink: 0 }}>
                    {driver.firstName?.[0]}{driver.lastName?.[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{driver.firstName} {driver.lastName}</h4>
                    <p style={{ margin: 0, fontSize: 12, color: '#64748b' }}>{driver.phoneNumber}</p>
                  </div>
                  <StatusBadge status={driver.verificationStatus || 'pending'} />
                </div>

                {/* Vehicle Info */}
                {driver.vehicle && (
                  <div style={{ marginBottom: 12, padding: '10px 12px', background: '#f8fafc', borderRadius: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                      <FaCar style={{ color: '#2563eb', fontSize: 12 }} />
                      <strong style={{ fontSize: 12, color: '#1e293b' }}>{driver.vehicle.make} {driver.vehicle.model} — {driver.vehicle.plateNumber}</strong>
                    </div>
                    <div style={{ display: 'flex', gap: 12, fontSize: 11, color: '#64748b' }}>
                      <span>Year: {driver.vehicle.year}</span>
                      <span>Color: {driver.vehicle.color}</span>
                      <span>Type: {driver.vehicle.type}</span>
                    </div>
                  </div>
                )}

                {/* Document Status Mini-Badges */}
                <div style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b' }}>Documents</span>
                    {pendingDocs > 0 && (
                      <span style={{ fontSize: 10, fontWeight: 700, background: '#fef3c7', color: '#92400e', padding: '1px 6px', borderRadius: 10 }}>
                        {pendingDocs} Pending Review
                      </span>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                    {docs.map((doc, idx) => (
                      <span key={idx} style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 20, fontWeight: 600,
                        background: doc.status === 'verified' ? '#dcfce7' : '#fef3c7',
                        color: doc.status === 'verified' ? '#15803d' : '#b45309'
                      }}>
                        {doc.fileIcon} {doc.title}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Rating & Trips */}
                <div style={{ display: 'flex', gap: 16, marginBottom: 14, fontSize: 12, color: '#64748b' }}>
                  <span><FaStar style={{ color: '#f59e0b' }} /> {driver.rating?.average?.toFixed(1) || '0.0'}</span>
                  <span>🚗 {driver.totalTrips || 0} trips</span>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    type="button"
                    style={{ flex: 1, padding: '8px', background: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}
                    onClick={() => { setInspectDriver(driver); setRejectionReason(''); setCustomReason(''); }}
                  >
                    <FaFileImage /> Inspect Docs
                  </button>
                  {(driver.verificationStatus === 'pending' || !driver.verificationStatus) && (
                    <>
                      <button
                        type="button"
                        className="btn btn-success btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => handleVerify(driver._id, 'approve', '')}
                      >
                        <FaCheck /> Approve
                      </button>
                      <button
                        type="button"
                        className="btn btn-danger btn-sm"
                        style={{ flex: 1 }}
                        onClick={() => { setInspectDriver(driver); setRejectionReason('License is expired'); }}
                      >
                        <FaTimes /> Reject
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
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.55)', zIndex: 9999, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }} onClick={() => setInspectDriver(null)}>
          <div
            style={{ background: '#fff', width: '100%', maxWidth: 600, borderRadius: '20px 20px 0 0', padding: 24, maxHeight: '85vh', overflowY: 'auto', boxShadow: '0 -8px 40px rgba(0,0,0,0.2)' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Handle */}
            <div style={{ width: 40, height: 4, background: '#e2e8f0', borderRadius: 2, margin: '0 auto 20px' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700 }}>📋 Document Inspection</h3>
                <p style={{ margin: '2px 0 0', fontSize: 12, color: '#64748b' }}>{inspectDriver.firstName} {inspectDriver.lastName} · {inspectDriver.phoneNumber}</p>
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
                        border: `2px solid ${status === 'verified' ? '#86efac' : hasImage ? '#93c5fd' : '#fde68a'}`,
                        borderRadius: 12,
                        padding: 14,
                        background: status === 'verified' ? '#f0fdf4' : hasImage ? '#eff6ff' : '#fffbeb'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                          <span style={{ fontSize: 22 }}>{item.fileIcon}</span>
                          <span style={{
                            fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 20,
                            background: status === 'verified' ? '#dcfce7' : '#fef3c7',
                            color: status === 'verified' ? '#15803d' : '#b45309'
                          }}>
                            {status === 'verified' ? '✅ VERIFIED' : hasImage ? '⏳ UPLOADED — REVIEW' : '⚠️ NOT UPLOADED'}
                          </span>
                        </div>

                        <div style={{ fontSize: 12, fontWeight: 700, color: '#1e293b', marginBottom: 4 }}>{item.title}</div>

                        {/* Real Uploaded Photo Thumbnail */}
                        {hasImage ? (
                          <div style={{ borderRadius: 8, overflow: 'hidden', height: 120, background: '#e2e8f0', margin: '8px 0', border: '1px solid #cbd5e1' }}>
                            <img src={docObj.data} alt={item.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          </div>
                        ) : (
                          <div style={{ fontSize: 11, color: '#64748b', fontStyle: 'italic', margin: '8px 0' }}>No image file attached</div>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            {/* Rejection Reason Selector */}
            {(inspectDriver.verificationStatus === 'pending' || !inspectDriver.verificationStatus) && (
              <div style={{ background: '#fef9f0', border: '1px solid #fde68a', borderRadius: 12, padding: 16, marginBottom: 20 }}>
                <h4 style={{ margin: '0 0 10px', fontSize: 13, fontWeight: 700, color: '#92400e' }}>⚠️ Rejection Reason (required if rejecting)</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: rejectionReason === 'Other (custom)' ? 10 : 0 }}>
                  {REJECTION_REASONS.map(reason => (
                    <button
                      key={reason}
                      type="button"
                      onClick={() => setRejectionReason(reason)}
                      style={{
                        padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                        background: rejectionReason === reason ? '#dc2626' : '#fff',
                        color: rejectionReason === reason ? 'white' : '#1e293b',
                        border: `1px solid ${rejectionReason === reason ? '#dc2626' : '#e2e8f0'}`
                      }}
                    >
                      {reason}
                    </button>
                  ))}
                </div>
                {rejectionReason === 'Other (custom)' && (
                  <input
                    type="text"
                    placeholder="Type custom rejection reason..."
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, marginTop: 8 }}
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
                  style={{ flex: 1, padding: '12px', background: '#16a34a', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  ✅ {submitting ? 'Approving...' : 'Approve Driver'}
                </button>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleRejectFromDrawer}
                  style={{ flex: 1, padding: '12px', background: '#dc2626', color: 'white', border: 'none', borderRadius: 10, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
                >
                  ❌ {submitting ? 'Rejecting...' : 'Reject with Reason'}
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
