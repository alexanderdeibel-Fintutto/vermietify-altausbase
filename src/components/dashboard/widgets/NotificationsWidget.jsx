import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';
import { VfBadge } from '@/components/shared/VfBadge';

export default function NotificationsWidget() {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-widget'],
    queryFn: () => base44.entities.Notification.filter({ is_read: false }, '-created_date', 5)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Benachrichtigungen
          {notifications.length > 0 && (
            <span className="vf-badge vf-badge-error">{notifications.length}</span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {notifications.map((notif) => (
            <div key={notif.id} className="p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex items-start gap-2">
                <VfBadge variant={notif.type} dot />
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm">{notif.title}</div>
                  <div className="text-xs text-[var(--theme-text-muted)] mt-1">{notif.message}</div>
                  <TimeAgo date={notif.created_date} className="text-xs text-[var(--theme-text-muted)] mt-1" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}