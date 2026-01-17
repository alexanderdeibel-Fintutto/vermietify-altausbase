import React from 'react';

export default function TimeAgo({ date }) {
  const getTimeAgo = (date) => {
    const seconds = Math.floor((new Date() - new Date(date)) / 1000);
    
    if (seconds < 60) return 'Gerade eben';
    if (seconds < 3600) return `vor ${Math.floor(seconds / 60)} Min.`;
    if (seconds < 86400) return `vor ${Math.floor(seconds / 3600)} Std.`;
    if (seconds < 604800) return `vor ${Math.floor(seconds / 86400)} Tagen`;
    
    return new Date(date).toLocaleDateString('de-DE');
  };

  return (
    <span className="text-[var(--theme-text-muted)]" title={new Date(date).toLocaleString('de-DE')}>
      {getTimeAgo(date)}
    </span>
  );
}