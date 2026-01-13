import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, CheckCircle2, AlertCircle, Info, AlertTriangle, Trash2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export default function NotificationCenter() {
  const [filter, setFilter] = useState('unread');
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification?.list?.('-created_date', 100) || []
  });

  const markReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification?.update?.(notificationId, { is_read: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification?.delete?.(notificationId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const filtered = filter === 'unread' 
    ? notifications.filter(n => !n.is_read)
    : notifications;

  const getTypeIcon = (type) => {
    if (type === 'success') return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    if (type === 'error') return <AlertCircle className="w-5 h-5 text-red-600" />;
    if (type === 'warning') return <AlertTriangle className="w-5 h-5 text-amber-600" />;
    return <Info className="w-5 h-5 text-blue-600" />;
  };

  return (
    <div className="space-y-4">
      {/* Filter */}
      <div className="flex gap-2">
        <Button
          size="sm"
          variant={filter === 'unread' ? 'default' : 'outline'}
          onClick={() => setFilter('unread')}
        >
          Ungelesen ({notifications.filter(n => !n.is_read).length})
        </Button>
        <Button
          size="sm"
          variant={filter === 'all' ? 'default' : 'outline'}
          onClick={() => setFilter('all')}
        >
          Alle
        </Button>
      </div>

      {/* Notifications List */}
      <div className="space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-8 text-slate-500">
            <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Keine Benachrichtigungen</p>
          </div>
        ) : (
          filtered.map(notification => (
            <Card
              key={notification.id}
              className={!notification.is_read ? 'border-blue-300 bg-blue-50' : ''}
            >
              <CardContent className="p-3">
                <div className="flex items-start gap-3">
                  {getTypeIcon(notification.type)}
                  <div className="flex-1">
                    <h4 className="text-sm font-medium">{notification.title}</h4>
                    <p className="text-xs text-slate-600 mt-1">{notification.message}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {notification.category}
                      </Badge>
                      {notification.scheduled_at && (
                        <span className="text-xs text-slate-500">
                          {new Date(notification.scheduled_at).toLocaleString('de-DE')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    {notification.action_url && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.location.href = notification.action_url}
                      >
                        Öffnen
                      </Button>
                    )}
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => markReadMutation.mutate(notification.id)}
                      >
                        ✓
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => deleteMutation.mutate(notification.id)}
                    >
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}