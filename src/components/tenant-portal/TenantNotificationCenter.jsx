import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, MessageSquare, Wrench, FileText, Trash2, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantNotificationCenter({ tenantId }) {
  const [isOpen, setIsOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['tenantNotifications', tenantId],
    queryFn: () => base44.entities.Notification.filter(
      { tenant_id: tenantId },
      '-created_at',
      50
    ),
    refetchInterval: 5000,
    enabled: !!tenantId
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantNotifications', tenantId] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) => 
      base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantNotifications', tenantId] });
    }
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message': return <MessageSquare className="w-4 h-4 text-blue-600" />;
      case 'maintenance': return <Wrench className="w-4 h-4 text-amber-600" />;
      case 'document': return <FileText className="w-4 h-4 text-green-600" />;
      default: return <Bell className="w-4 h-4 text-slate-600" />;
    }
  };

  const getNotificationLabel = (type) => {
    const labels = {
      message: 'Neue Nachricht',
      maintenance: 'Wartungsanfrage',
      document: 'Dokument hochgeladen'
    };
    return labels[type] || 'Benachrichtigung';
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5 text-slate-600" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center font-semibold">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-4 text-center text-slate-500 text-sm">
              Keine Benachrichtigungen
            </div>
          ) : (
            <div className="divide-y">
              {notifications.map(notification => (
                <div
                  key={notification.id}
                  className={`p-4 hover:bg-slate-50 transition-colors ${
                    !notification.is_read ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-start gap-2 flex-1">
                      {getNotificationIcon(notification.notification_type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-slate-900">
                          {notification.title}
                        </p>
                        <Badge variant="outline" className="text-xs mt-1">
                          {getNotificationLabel(notification.notification_type)}
                        </Badge>
                      </div>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={() => markAsReadMutation.mutate(notification.id)}
                        className="text-blue-600 hover:text-blue-700 flex-shrink-0"
                        title="Als gelesen markieren"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {notification.message && (
                    <p className="text-xs text-slate-600 mb-2">
                      {notification.message}
                    </p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500">
                      {new Date(notification.created_at).toLocaleDateString('de-DE')}
                    </span>
                    <button
                      onClick={() => deleteNotificationMutation.mutate(notification.id)}
                      className="text-slate-400 hover:text-red-600 flex-shrink-0"
                      title="Löschen"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
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