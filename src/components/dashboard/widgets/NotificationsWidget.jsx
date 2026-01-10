import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { AlertCircle, Bell } from 'lucide-react';

export default function NotificationsWidget() {
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications-widget', user?.email],
    queryFn: async () => {
      if (!user?.email) return [];
      const result = await base44.asServiceRole.entities.Notification.filter({
        recipient_email: user.email
      });
      return result
        .sort((a, b) => new Date(b.created_date) - new Date(a.created_date))
        .slice(0, 5);
    },
    enabled: !!user?.email
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4 text-blue-600" />
          Benachrichtigungen
          {unreadCount > 0 && (
            <Badge variant="destructive" className="text-xs ml-auto">
              {unreadCount}
            </Badge>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {notifications.length === 0 ? (
          <p className="text-sm text-slate-600 text-center py-4">Keine Benachrichtigungen</p>
        ) : (
          <div className="space-y-2">
            {notifications.map(notif => (
              <div
                key={notif.id}
                className={`p-2 rounded text-sm ${
                  !notif.is_read ? 'bg-blue-50 border border-blue-200' : 'bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-3 h-3 text-slate-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{notif.title}</p>
                    <p className="text-xs text-slate-600 truncate">{notif.message}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {format(new Date(notif.created_date), 'HH:mm', { locale: de })}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}