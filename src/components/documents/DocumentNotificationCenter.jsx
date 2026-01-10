import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, X, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';

const typeIcons = {
  task_overdue: <AlertCircle className="w-4 h-4 text-red-600" />,
  task_due: <Bell className="w-4 h-4 text-blue-600" />,
  rule_executed: <CheckCircle2 className="w-4 h-4 text-green-600" />,
  status_changed: <CheckCircle2 className="w-4 h-4 text-purple-600" />,
  document_event: <Info className="w-4 h-4 text-slate-600" />
};

export default function DocumentNotificationCenter() {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me().catch(() => null)
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const all = await base44.entities.Notification.filter({
        recipient_email: user.email
      });
      return all.sort((a, b) => new Date(b.created_date) - new Date(a.created_date)).slice(0, 10);
    },
    enabled: !!user?.email,
    refetchInterval: 30000
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.email] });
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative text-slate-400 hover:text-slate-700">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0 max-h-96 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-200 bg-slate-50">
          <h3 className="font-medium text-sm text-slate-900">Benachrichtigungen</h3>
        </div>

        <div className="overflow-y-auto flex-1">
          {notifications.length === 0 ? (
            <div className="p-8 text-center">
              <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm text-slate-500">Keine Benachrichtigungen</p>
            </div>
          ) : (
            <div className="space-y-0.5 p-2">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    notif.is_read
                      ? 'bg-white border-slate-200'
                      : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-start gap-2">
                    <div className="mt-1 flex-shrink-0">{typeIcons[notif.notification_type] || <Bell className="w-4 h-4" />}</div>
                    <div className="flex-1 min-w-0">
                      <h4 className={`text-xs font-medium leading-tight ${notif.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                        {notif.title}
                      </h4>
                      <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {format(new Date(notif.created_date), 'dd. MMM HH:mm', { locale: de })}
                      </p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {!notif.is_read && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => markAsReadMutation.mutate(notif.id)}
                          title="Als gelesen markieren"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                        </Button>
                      )}
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-5 w-5"
                        onClick={() => deleteNotificationMutation.mutate(notif.id)}
                        title="Löschen"
                      >
                        <X className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}