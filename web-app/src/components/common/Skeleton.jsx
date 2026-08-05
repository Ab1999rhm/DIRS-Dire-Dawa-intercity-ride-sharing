import React from 'react';
import './Skeleton.css';

export const Skeleton = ({ width, height = 20, borderRadius, style = {} }) => (
  <div className="skeleton" style={{ width, height, borderRadius, ...style }} />
);

export const SkeletonCard = ({ lines = 3, avatar = false }) => (
  <div className="skeleton-card">
    {avatar && <Skeleton width={48} height={48} borderRadius="50%" />}
    <div className="skeleton-lines">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} width={i === lines - 1 ? '60%' : '100%'} height={14} />
      ))}
    </div>
  </div>
);

export const SkeletonTable = ({ rows = 5, cols = 4 }) => (
  <div className="skeleton-table">
    <div className="skeleton-table-header">
      {Array.from({ length: cols }).map((_, i) => (
        <Skeleton key={i} width="80%" height={12} />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, i) => (
      <div key={i} className="skeleton-table-row">
        {Array.from({ length: cols }).map((_, j) => (
          <Skeleton key={j} width={j === 0 ? '60%' : '80%'} height={14} />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonStat = () => (
  <div className="skeleton-stat">
    <Skeleton width={48} height={48} borderRadius="12px" />
    <div className="skeleton-stat-text">
      <Skeleton width="70%" height={22} />
      <Skeleton width="50%" height={12} />
    </div>
  </div>
);
