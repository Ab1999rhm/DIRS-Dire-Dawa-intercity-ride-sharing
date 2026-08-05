import React from 'react';
import '../pages/Pages.css';

const EarningsChart = ({ data }) => {
  if (!data || data.length === 0) {
    return (
      <div className="chart-container">
        <h3>Earnings Trend</h3>
        <div className="chart-empty">No data available</div>
      </div>
    );
  }

  const maxVal = Math.max(...data.map(d => d.amount), 1);

  return (
    <div className="chart-container">
      <h3>Earnings Trend</h3>
      <div className="chart-bars">
        {data.map((item, i) => (
          <div key={i} className="chart-bar-wrapper">
            <div className="chart-bar-track">
              <div
                className="chart-bar-fill"
                style={{ height: `${(item.amount / maxVal) * 100}%` }}
              />
            </div>
            <span className="chart-bar-value">{item.amount}</span>
            <span className="chart-bar-label">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EarningsChart;
