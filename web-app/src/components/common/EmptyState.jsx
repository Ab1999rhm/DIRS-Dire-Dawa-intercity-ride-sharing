import React from 'react';
import './EmptyState.css';

const EmptyState = ({ icon, title, description, action, actionLabel, onAction }) => (
  <div className="empty-state">
    {icon && <div className="empty-state-icon">{icon}</div>}
    <h3 className="empty-state-title">{title}</h3>
    {description && <p className="empty-state-desc">{description}</p>}
    {(action || onAction) && (
      <button className="btn btn-primary" onClick={onAction || action}>
        {actionLabel || 'Get Started'}
      </button>
    )}
  </div>
);

export default EmptyState;
