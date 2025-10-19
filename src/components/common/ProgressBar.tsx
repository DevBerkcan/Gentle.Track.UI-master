import React from 'react';

interface ProgressBarProps {
  progress: number;
  showLabel?: boolean;
  height?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  progress, 
  showLabel = true,
  height = '8px'
}) => {
  return (
    <div style={{ width: '100%' }}>
      <div className="progress-bar" style={{ height }}>
        <div className="progress-fill" style={{ width: `${progress}%` }}></div>
      </div>
      {showLabel && <span style={{ fontSize: '12px', marginLeft: '5px' }}>{progress}%</span>}
    </div>
  );
};

export default ProgressBar;