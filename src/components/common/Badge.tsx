import React from 'react';

interface BadgeProps {
  status: string;
  style?: React.CSSProperties;
}

const Badge: React.FC<BadgeProps> = ({ status, style }) => {
  const getBadgeClass = (status: string): string => {
    const badges: Record<string, string> = {
      'Planung': 'badge-info',
      'In Bearbeitung': 'badge-info',
      'Warten auf Feedback': 'badge-warning',
      'Abgeschlossen': 'badge-success',
      'Aktiv': 'badge-success',
      'Inaktiv': 'badge-warning',
      'Super Admin': 'badge-success',
      'Admin': 'badge-info',
      'Projektmanager': 'badge-warning',
    };
    return badges[status] || 'badge-info';
  };

  return (
    <span className={`badge ${getBadgeClass(status)}`} style={style}>
      {status}
    </span>
  );
};

export default Badge;