import React from 'react';

interface StatCardProps {
  title: string;
  value: number;
  gradient?: string;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, gradient }) => {
  return (
    <div className="stat-card" style={gradient ? { background: gradient } : {}}>
      <h3>{title}</h3>
      <div className="number">{value}</div>
    </div>
  );
};

export default StatCard;