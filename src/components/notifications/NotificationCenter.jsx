import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Bell, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const typeIcons = {
  maintenance_assigned: '🔧',
  equipment_status_change: '⚠️',
  task_overdue: '⏰',
  tenant_communication: '💬',
  report_generated: '📊',
  system_alert: '🚨',
  payment: '💰',
  maintenance: '🔧',
  contract: '📄',
  message: '💬',
  ticket: '🎫',
  system: '⚙️'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  normal: 'bg-slate-100 text-slate-700',
  high: 'bg-orange-100 text-orange-700',
  critical: 'bg-red-100 text-red-700'
};

export default function NotificationCenter() {
  const [open, setOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', currentUser?.email],
    queryFn: () => {
      if (!currentUser?.email) return [];
      return base44.entities.Notification.filter(
        { user_email: currentUser.email },
        '-created_date',
        50
      );
    },
    enabled: !!currentUser?.email,
    refetchInterval: 30000 // Refetch every 30 seconds
  });

  // Request push permission for critical notifications
  React.useEffect(() => {
    const checkPushPermission = async () => {
      if ('Notification' in window && Notification.permission === 'default') {
        const criticalUnread = notifications.filter(n => !n.is_read && n.priority === 'critical');
        if (criticalUnread.length > 0) {
          await Notification.requestPermission();
        }
      }
    };
    checkPushPermission();
  }, [notifications]);

  // Show browser push for critical notifications
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'granted') {
      const newCritical = notifications.filter(n => !n.is_read && n.priority === 'critical' && !n.sent_via_push);
      newCritical.forEach(notif => {
        new Notification(notif.title, {
          body: notif.message,
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: notif.id
        });
        // Mark as sent
        base44.entities.Notification.update(notif.id, { sent_via_push: true });
      });
    }
  }, [notifications]);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      for (const notif of unread) {
        await base44.entities.Notification.update(notif.id, {
          is_read: true,
          read_at: new Date().toISOString()
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const recentNotifications = notifications.slice(0, 5);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-slate-600 hover:text-slate-900"
          title="Benachrichtigungen"
        >
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-0 right-0 h-5 w-5 bg-red-600 text-white text-xs rounded-full flex items-center justify-center font-light">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent className="w-96 p-0" align="end">
        <div className="border-b border-slate-200 p-4 flex justify-between items-center">
          <h2 className="font-light text-slate-900">Benachrichtigungen</h2>
          {unreadCount > 0 && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => clearAllMutation.mutate()}
              className="text-xs font-light"
            >
              Alle als gelesen
            </Button>
          )}
        </div>

        <div className="max-h-96 overflow-y-auto">
          {recentNotifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-light text-slate-600">Keine Benachrichtigungen</p>
            </div>
          ) : (
            <div className="space-y-1">
              {recentNotifications.map(notif => (
                <div
                  key={notif.id}
                  className={cn(
                    'p-3 border-b border-slate-100 last:border-0 cursor-pointer hover:bg-slate-50 transition-colors',
                    !notif.is_read && 'bg-blue-50'
                  )}
                  onClick={() => {
                    if (!notif.is_read) {
                      markAsReadMutation.mutate(notif.id);
                    }
                  }}
                >
                  <div className="flex items-start gap-2">
                   <span className="text-lg mt-0.5">{typeIcons[notif.type] || typeIcons[notif.notification_type] || '📌'}</span>
                    <div className="flex-1">
                      <h4 className="font-light text-slate-900 text-sm">{notif.title}</h4>
                      <p className="text-xs font-light text-slate-600 mt-0.5">{notif.message}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge className={priorityColors[notif.priority]}>
                          {notif.priority}
                        </Badge>
                        {!notif.is_read && (
                          <span className="h-2 w-2 bg-blue-600 rounded-full"></span>
                        )}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-slate-400 hover:text-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteMutation.mutate(notif.id);
                      }}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-slate-200 p-3 flex gap-2">
          <Link to={createPageUrl('NotificationCenter')} className="flex-1">
            <Button
              variant="outline"
              size="sm"
              className="w-full font-light text-xs"
              onClick={() => setOpen(false)}
            >
              Alle anzeigen
            </Button>
          </Link>
          <Link to={createPageUrl('NotificationCenter')}>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-600"
              title="Benachrichtigungseinstellungen"
              onClick={() => setOpen(false)}
            >
              <Settings className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}