import React from 'react';

export default function NotificationBadge({ count }) {
  if (!count || count === 0) return null;

  return (
    <span className="vf-navbar-icon-btn-badge">
      {count > 99 ? '99+' : count}
    </span>
  );
}