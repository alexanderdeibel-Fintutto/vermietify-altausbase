import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import NotificationCard from '@/components/notifications/NotificationCard';
import { Button } from '@/components/ui/button';
import { CheckCheck, Trash2 } from 'lucide-react';
import { VfEmptyState } from '@/components/shared/VfEmptyState';

export default function NotificationCenter() {
  const [filter, setFilter] = useState('all');
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: async () => {
      if (filter === 'unread') {
        return base44.entities.Notification.filter({ is_read: false });
      }
      return base44.entities.Notification.list('-created_date');
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = await base44.entities.Notification.filter({ is_read: false });
      await Promise.all(
        unread.map(n => base44.entities.Notification.update(n.id, { is_read: true }))
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  return (
    <div className="p-6">
      <PageHeader
        title="Benachrichtigungen"
        subtitle={`${notifications.filter(n => !n.is_read).length} ungelesen`}
        actions={
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => markAllReadMutation.mutate()}
            >
              <CheckCheck className="h-4 w-4 mr-2" />
              Alle als gelesen
            </Button>
          </div>
        }
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

      {notifications.length === 0 ? (
        <VfEmptyState
          title="Keine Benachrichtigungen"
          description="Sie haben alle Benachrichtigungen gelesen"
        />
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onClick={() => markReadMutation.mutate(notification.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}