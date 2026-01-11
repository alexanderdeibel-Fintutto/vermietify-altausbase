import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, FileText, MessageSquare, Wrench, Euro } from 'lucide-react';

export default function TenantNotificationCenter({ tenantId }) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['tenant-notifications', tenantId],
    queryFn: () => base44.entities.TenantNotification.filter({ tenant_id: tenantId }, '-sent_at', 20)
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.TenantNotification.update(notificationId, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] })
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.TenantNotification.update(n.id, { is_read: true })
      ));
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-notifications'] })
  });

  const getIcon = (type) => {
    switch(type) {
      case 'maintenance_update': return <Wrench className="w-4 h-4" />;
      case 'new_document': return <FileText className="w-4 h-4" />;
      case 'new_message': return <MessageSquare className="w-4 h-4" />;
      case 'payment_reminder': return <Euro className="w-4 h-4" />;
      default: return <Bell className="w-4 h-4" />;
    }
  };

  const getColor = (priority) => {
    switch(priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-blue-100 text-blue-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Benachrichtigungen
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white">{unreadCount}</Badge>
            )}
          </CardTitle>
          {unreadCount > 0 && (
            <Button size="sm" variant="outline" onClick={() => markAllAsReadMutation.mutate()}>
              <Check className="w-4 h-4 mr-2" />
              Alle als gelesen
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-2 max-h-96 overflow-y-auto">
        {notifications.map(notif => (
          <div
            key={notif.id}
            className={`p-3 border rounded-lg ${!notif.is_read ? 'bg-blue-50 border-blue-200' : 'bg-white'}`}
          >
            <div className="flex items-start gap-3">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${getColor(notif.priority)}`}>
                {getIcon(notif.notification_type)}
              </div>
              <div className="flex-1">
                <div className="flex items-start justify-between mb-1">
                  <h4 className="font-medium text-sm">{notif.title}</h4>
                  {!notif.is_read && (
                    <Badge className="bg-blue-500 text-white text-xs">Neu</Badge>
                  )}
                </div>
                <p className="text-sm text-slate-600 mb-2">{notif.message}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500">
                    {new Date(notif.sent_at || notif.created_date).toLocaleString('de-DE')}
                  </span>
                  {!notif.is_read && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => markAsReadMutation.mutate(notif.id)}
                    >
                      Als gelesen markieren
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
        {notifications.length === 0 && (
          <p className="text-center text-slate-600 py-8">Keine Benachrichtigungen</p>
        )}
      </CardContent>
    </Card>
  );
}