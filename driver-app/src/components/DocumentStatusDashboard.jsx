import React from 'react';
import '../pages/Pages.css';

const DocumentStatusDashboard = ({ documents }) => {
  const items = [
    { label: 'Email Verified', status: 'verified', detail: 'Email address verified' },
    { label: 'Driver License', status: documents?.driver?.licensePhoto && documents.driver.licensePhoto !== 'pending' ? 'uploaded' : 'missing', detail: documents?.driver?.licenseNumber || 'Not uploaded' },
    { label: 'National ID', status: documents?.driver?.nationalIdPhoto && documents.driver.nationalIdPhoto !== 'pending' ? 'uploaded' : 'missing', detail: documents?.driver?.nationalId || 'Not uploaded' },
    { label: 'Vehicle Photo', status: documents?.vehicle?.vehiclePhoto ? 'uploaded' : 'missing', detail: documents?.vehicle?.vehiclePhoto ? 'Uploaded' : 'Not uploaded' },
    { label: 'Registration', status: documents?.vehicle?.registrationPhoto ? 'uploaded' : 'missing', detail: documents?.vehicle?.registrationExpiry ? `Expires: ${new Date(documents.vehicle.registrationExpiry).toLocaleDateString()}` : 'Not uploaded' },
    { label: 'Insurance', status: documents?.vehicle?.insurancePhoto ? 'uploaded' : 'missing', detail: documents?.vehicle?.insuranceExpiry ? `Expires: ${new Date(documents.vehicle.insuranceExpiry).toLocaleDateString()}` : 'Not uploaded' },
  ];

  const getStatusColor = (status) => {
    switch (status) {
      case 'verified': return '#00c853';
      case 'uploaded': return '#1a73e8';
      case 'pending': return '#ff9100';
      case 'missing': return '#ff1744';
      default: return '#94a3b8';
    }
  };

  return (
    <div className="doc-status-dashboard">
      <h3>Document Status</h3>
      <div className="doc-status-list">
        {items.map((item, i) => (
          <div key={i} className="doc-status-item">
            <div className="doc-status-dot" style={{ background: getStatusColor(item.status) }} />
            <div className="doc-status-info">
              <span className="doc-status-label">{item.label}</span>
              <span className="doc-status-detail">{item.detail}</span>
            </div>
            <span className="doc-status-badge" style={{ color: getStatusColor(item.status) }}>
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentStatusDashboard;
