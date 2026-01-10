import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Bell, X, Check } from 'lucide-react';

export default function NotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const result = await base44.asServiceRole.entities.Notification.filter({
        recipient_email: user.email
      });
      return result.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user?.email,
    refetchInterval: 10000
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.asServiceRole.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.asServiceRole.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getTypeIcon = (type) => {
    switch (type) {
      case 'task_assigned':
        return '📋';
      case 'approval_required':
        return '⏳';
      case 'workflow_status':
        return '⚙️';
      default:
        return '🔔';
    }
  };

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

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <Badge
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              variant="destructive"
            >
              {unreadCount}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b p-3">
          <h3 className="font-medium text-slate-900">Benachrichtigungen</h3>
          <p className="text-xs text-slate-600 mt-0.5">
            {unreadCount} ungelesen
          </p>
        </div>

        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-sm">
              Keine Benachrichtigungen
            </div>
          ) : (
            <div className="divide-y">
              {notifications.slice(0, 10).map(notification => (
                <div
                  key={notification.id}
                  className={`p-3 hover:bg-slate-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-2 mb-1">
                    <span className="text-lg">{getTypeIcon(notification.notification_type)}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-1 mb-0.5">
                        <p className="text-sm font-medium text-slate-900 truncate">
                          {notification.title}
                        </p>
                        <Badge className={getPriorityColor(notification.priority)} variant="secondary" className="text-xs flex-shrink-0">
                          {notification.priority}
                        </Badge>
                      </div>
                      <p className="text-xs text-slate-600 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(notification.created_date), 'dd.MM HH:mm', { locale: de })}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-1 mt-2">
                    {!notification.is_read && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 text-xs flex-1"
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                      >
                        <Check className="w-3 h-3 mr-1" />
                        Gelesen
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 px-2"
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {notifications.length > 10 && (
          <div className="border-t p-2">
            <Button variant="ghost" className="w-full text-xs" size="sm">
              Alle anzeigen ({notifications.length})
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}