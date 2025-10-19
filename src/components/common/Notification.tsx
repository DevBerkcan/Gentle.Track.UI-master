// src/components/common/Notification.tsx
import { useEffect } from 'react';
import './Notification.css';

interface NotificationProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose: () => void;
  duration?: number;
}

const Notification: React.FC<NotificationProps> = ({ 
  type, 
  message, 
  onClose, 
  duration = 3000 
}) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const icons = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  return (
    <div className="notification-overlay" onClick={onClose}>
      <div className={`notification notification-${type}`} onClick={(e) => e.stopPropagation()}>
        <div className="notification-icon-large">{icons[type]}</div>
        <p className="notification-message">{message}</p>
        <button className="btn btn-secondary btn-small" onClick={onClose}>
          Schließen
        </button>
      </div>
    </div>
  );
};

export default Notification;