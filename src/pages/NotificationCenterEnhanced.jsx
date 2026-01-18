import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Bell, Check, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TimeAgo from '@/components/shared/TimeAgo';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function NotificationCenterEnhanced() {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('all');

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date')
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showSuccess('Als gelesen markiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      showSuccess('Benachrichtigung gelöscht');
    }
  });

  const filtered = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <PageHeader
        title="Benachrichtigungen"
        subtitle={`${notifications.filter(n => !n.is_read).length} ungelesen`}
      />

      <div className="flex gap-2 mb-6">
        <Button 
          variant={filter === 'all' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('all')}
        >
          Alle
        </Button>
        <Button 
          variant={filter === 'unread' ? 'primary' : 'outline'}
          size="sm"
          onClick={() => setFilter('unread')}
        >
          Ungelesen
        </Button>
      </div>

      <div className="space-y-3">
        {filtered.map((notification) => (
          <Card key={notification.id} className={!notification.is_read ? 'border-l-4 border-l-[var(--theme-primary)]' : ''}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  notification.type === 'success' ? 'bg-[var(--vf-success-100)] text-[var(--vf-success-600)]' :
                  notification.type === 'error' ? 'bg-[var(--vf-error-100)] text-[var(--vf-error-600)]' :
                  notification.type === 'warning' ? 'bg-[var(--vf-warning-100)] text-[var(--vf-warning-600)]' :
                  'bg-[var(--vf-info-100)] text-[var(--vf-info-600)]'
                }`}>
                  <Bell className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="font-medium mb-1">{notification.title}</div>
                  <p className="text-sm text-[var(--theme-text-secondary)]">{notification.message}</p>
                  <TimeAgo date={notification.created_date} className="text-xs text-[var(--theme-text-muted)] mt-2" />
                </div>
                <div className="flex gap-2">
                  {!notification.is_read && (
                    <Button 
                      variant="ghost" 
                      size="icon"
                      onClick={() => markReadMutation.mutate(notification.id)}
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => deleteMutation.mutate(notification.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}