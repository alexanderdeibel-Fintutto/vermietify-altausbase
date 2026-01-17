import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import TimeAgo from '@/components/shared/TimeAgo';
import { Bell, CheckCircle } from 'lucide-react';

export default function MobileNotifications() {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.filter({ is_read: false })
  });

  return (
    <div className="space-y-2">
      {notifications.map((notif) => (
        <Card key={notif.id}>
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--vf-info-100)] flex items-center justify-center flex-shrink-0">
                <Bell className="h-5 w-5 text-[var(--vf-info-600)]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm mb-1">{notif.title}</div>
                <div className="text-xs text-[var(--theme-text-secondary)]">{notif.message}</div>
                <TimeAgo date={notif.created_date} className="text-xs text-[var(--theme-text-muted)] mt-2" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}