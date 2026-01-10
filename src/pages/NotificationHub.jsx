import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Bell, Check, Trash2 } from 'lucide-react';

export default function NotificationHub() {
  const [filterRead, setFilterRead] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['all-notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const result = await base44.asServiceRole.entities.Notification.filter({
        recipient_email: user.email
      });
      return result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.asServiceRole.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.asServiceRole.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(
        unread.map(n =>
          base44.asServiceRole.entities.Notification.update(n.id, {
            is_read: true,
            read_at: new Date().toISOString()
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
    }
  });

  const filteredNotifications = notifications.filter(n => {
    if (filterRead === 'all') return true;
    if (filterRead === 'unread') return !n.is_read;
    if (filterRead === 'read') return n.is_read;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-700';
      case 'high':
        return 'bg-orange-100 text-orange-700';
      case 'medium':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-blue-100 text-blue-700';
    }
  };

  const getTypeLabel = (type) => {
    const labels = {
      task_due: 'Aufgabe fällig',
      task_overdue: 'Aufgabe überfällig',
      rule_executed: 'Regel ausgeführt',
      status_changed: 'Status geändert',
      document_event: 'Dokument-Event',
      system: 'System'
    };
    return labels[type] || type;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Bell className="w-8 h-8" />
            Benachrichtigungszentrale
          </h1>
          <p className="text-slate-600 text-sm mt-1">
            {unreadCount} ungelesen von {notifications.length} Benachrichtigungen
          </p>
        </div>
        {unreadCount > 0 && (
          <Button
            variant="outline"
            onClick={() => markAllAsReadMutation.mutate()}
            disabled={markAllAsReadMutation.isPending}
          >
            <Check className="w-4 h-4 mr-2" />
            Alle als gelesen
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <Select value={filterRead} onValueChange={setFilterRead}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="unread">Ungelesen</SelectItem>
              <SelectItem value="read">Gelesen</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <Card className="bg-slate-50">
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Benachrichtigungen
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map(notification => (
            <Card
              key={notification.id}
              className={`${!notification.is_read ? 'bg-blue-50 border-blue-200' : ''}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start justify-between gap-4 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getPriorityColor(notification.priority)} variant="secondary">
                        {notification.priority}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {getTypeLabel(notification.notification_type)}
                      </Badge>
                      {!notification.is_read && (
                        <Badge variant="secondary" className="bg-blue-100 text-blue-700">
                          Neu
                        </Badge>
                      )}
                    </div>
                    <h3 className="font-medium text-slate-900">{notification.title}</h3>
                    <p className="text-sm text-slate-600 mt-1">{notification.message}</p>
                    <p className="text-xs text-slate-500 mt-2">
                      {format(new Date(notification.created_date), 'dd.MM.yyyy HH:mm:ss', { locale: de })}
                    </p>
                  </div>

                  <div className="flex gap-2 flex-shrink-0">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                    >
                      <Trash2 className="w-4 h-4" />
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