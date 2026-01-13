import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Bell } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery } from '@tanstack/react-query';

export default function NotificationBadge() {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-unread'],
    queryFn: () => base44.entities.Notification?.list?.('-created_date', 100) || [],
    refetchInterval: 5000
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <Bell className="w-5 h-5 text-slate-600" />
      {unreadCount > 0 && (
        <Badge className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs">
          {unreadCount > 9 ? '9+' : unreadCount}
        </Badge>
      )}
    </div>
  );
}