import React from 'react';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function NotificationBell({ onClick }) {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ is_read: false })
  });

  const unreadCount = notifications.length;

  return (
    <button 
      onClick={onClick}
      className="vf-navbar-icon-btn relative"
      title="Benachrichtigungen"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="vf-navbar-icon-btn-badge">
          {unreadCount > 9 ? '9+' : unreadCount}
        </span>
      )}
    </button>
  );
}