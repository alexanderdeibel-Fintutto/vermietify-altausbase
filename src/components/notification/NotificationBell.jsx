import React from 'react';
import { Bell } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function NotificationBell({ onClick }) {
  const { data: unreadCount = 0 } = useQuery({
    queryKey: ['unread-notifications-count'],
    queryFn: async () => {
      const notifications = await base44.entities.Notification.filter({ is_read: false });
      return notifications.length;
    }
  });

  return (
    <button 
      className="vf-navbar-icon-btn"
      onClick={onClick}
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="vf-navbar-icon-btn-badge">{unreadCount}</span>
      )}
    </button>
  );
}