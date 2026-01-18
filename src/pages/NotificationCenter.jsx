import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { VfBadge } from '@/components/shared/VfBadge';
import TimeAgo from '@/components/shared/TimeAgo';
import { Button } from '@/components/ui/button';
import { CheckCheck } from 'lucide-react';

export default function NotificationCenter() {
  const { data: notifications = [] } = useQuery({
    queryKey: ['all-notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date')
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Benachrichtigungen"
        subtitle={`${unreadCount} ungelesen`}
        actions={
          <Button variant="outline" size="sm">
            <CheckCheck className="h-4 w-4 mr-2" />
            Alle als gelesen markieren
          </Button>
        }
      />

      <div className="mt-6 space-y-2">
        {notifications.map((notif) => (
          <div 
            key={notif.id}
            className={`p-4 rounded-lg border ${
              !notif.is_read 
                ? 'bg-[var(--theme-primary-light)] border-[var(--theme-primary)]' 
                : 'bg-white border-[var(--theme-border)]'
            }`}
          >
            <div className="flex items-start gap-3">
              <VfBadge variant={notif.type} dot />
              <div className="flex-1">
                <div className="font-medium">{notif.title}</div>
                <div className="text-sm text-[var(--theme-text-secondary)] mt-1">{notif.message}</div>
                <TimeAgo date={notif.created_date} className="text-xs text-[var(--theme-text-muted)] mt-2" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}