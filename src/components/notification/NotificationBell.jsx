import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import NotificationBadge from '@/components/notifications/NotificationBadge';

export default function NotificationBell() {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list()
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <button className="vf-navbar-icon-btn relative">
      <Bell className="h-5 w-5" />
      <NotificationBadge count={unreadCount} />
    </button>
  );
}