import React from 'react';

export default function NotificationBadge({ count }) {
  if (!count || count === 0) return null;

  return (
    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--vf-error-500)] text-white text-xs font-bold rounded-full flex items-center justify-center">
      {count > 9 ? '9+' : count}
    </span>
  );
}