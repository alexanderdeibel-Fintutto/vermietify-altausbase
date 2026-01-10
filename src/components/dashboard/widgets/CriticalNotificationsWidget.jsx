import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bell, Info } from 'lucide-react';

export default function CriticalNotificationsWidget() {
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification.list('-created_date', 50)
  });

  const unread = notifications.filter(n => !n.is_read);
  const critical = unread.filter(n => n.type === 'error' || n.type === 'warning');
  const recent = unread.slice(0, 5);

  const getIcon = (type) => {
    if (type === 'error') return <AlertTriangle className="w-4 h-4 text-red-600" />;
    if (type === 'warning') return <AlertTriangle className="w-4 h-4 text-orange-600" />;
    return <Info className="w-4 h-4 text-blue-600" />;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Benachrichtigungen
          </CardTitle>
          {unread.length > 0 && (
            <Badge variant={critical.length > 0 ? 'destructive' : 'secondary'}>
              {unread.length}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {recent.length > 0 ? (
          <div className="space-y-3">
            {recent.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-3 rounded-lg border ${
                  notification.type === 'error' ? 'bg-red-50 border-red-200' :
                  notification.type === 'warning' ? 'bg-orange-50 border-orange-200' :
                  'bg-blue-50 border-blue-200'
                }`}
              >
                <div className="flex items-start gap-2">
                  {getIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold">{notification.title}</p>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {notification.message}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-500 text-center py-4">
            Keine neuen Benachrichtigungen
          </p>
        )}
      </CardContent>
    </Card>
  );
}