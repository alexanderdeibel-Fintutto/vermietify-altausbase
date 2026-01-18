import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfBadge } from '@/components/shared/VfBadge';
import TimeAgo from '@/components/shared/TimeAgo';
import { Bell } from 'lucide-react';

export default function MobileNotifications() {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 10)
  });

  const unread = notifications.filter(n => !n.is_read);

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5" />
        <h2 className="text-lg font-semibold">Benachrichtigungen</h2>
        {unread.length > 0 && (
          <span className="vf-badge vf-badge-error">{unread.length}</span>
        )}
      </div>

      <div className="space-y-2">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            className={`p-3 rounded-lg border ${
              !notif.is_read 
                ? 'bg-[var(--theme-primary-light)] border-[var(--theme-primary)]' 
                : 'bg-white border-[var(--theme-border)]'
            }`}
          >
            <div className="flex items-start gap-2 mb-1">
              <VfBadge variant={notif.type} dot />
              <div className="flex-1">
                <div className="font-medium text-sm">{notif.title}</div>
                <p className="text-xs text-[var(--theme-text-secondary)] mt-1">{notif.message}</p>
              </div>
            </div>
            <TimeAgo date={notif.created_date} className="text-xs text-[var(--theme-text-muted)]" />
          </div>
        ))}
      </div>
    </div>
  );
}