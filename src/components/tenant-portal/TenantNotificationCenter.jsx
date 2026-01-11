import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, Trash2, CheckCircle2, AlertCircle, FileText, Home } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function TenantNotificationCenter({ tenantId }) {
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['tenantNotifications', tenantId],
    queryFn: async () => {
      const notifs = await base44.entities.TenantNotification.filter({
        tenant_id: tenantId
      });
      return notifs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    refetchInterval: 30000
  });

  const queryClient = useQueryClient();

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.TenantNotification.update(notificationId, { is_read: true }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantNotifications'] });
    }
  });

  const deleteNotificationMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.TenantNotification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantNotifications'] });
      toast.success('Benachrichtigung gelöscht');
    }
  });

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'invoice':
        return <FileText className="w-5 h-5 text-blue-600" />;
      case 'operating_costs':
        return <FileText className="w-5 h-5 text-green-600" />;
      case 'announcement':
        return <Bell className="w-5 h-5 text-purple-600" />;
      case 'payment_reminder':
        return <AlertCircle className="w-5 h-5 text-red-600" />;
      default:
        return <Home className="w-5 h-5 text-slate-600" />;
    }
  };

  const getNotificationTypeLabel = (type) => {
    const labels = {
      invoice: 'Rechnung',
      operating_costs: 'Betriebskostenabrechnung',
      announcement: 'Ankündigung',
      payment_reminder: 'Zahlungserinnerung'
    };
    return labels[type] || type;
  };

  const unreadCount = notifications?.filter(n => !n.is_read).length || 0;

  if (isLoading) return null;

  if (!notifications || notifications.length === 0) {
    return (
      <Card className="bg-slate-50 border-slate-200">
        <CardContent className="pt-6 text-center">
          <Bell className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-slate-500">Keine Benachrichtigungen</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Ungelesene Zusammenfassung */}
      {unreadCount > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-blue-600" />
            <span className="text-blue-900 font-semibold">
              {unreadCount} neue {unreadCount === 1 ? 'Benachrichtigung' : 'Benachrichtigungen'}
            </span>
          </div>
        </div>
      )}

      {/* Benachrichtigungen */}
      <div className="space-y-3">
        {notifications.map((notification) => (
          <Card
            key={notification.id}
            className={`transition-all ${
              !notification.is_read ? 'bg-blue-50 border-blue-200' : 'hover:shadow-md'
            }`}
          >
            <CardContent className="pt-6">
              <div className="flex gap-4">
                {/* Icon */}
                <div className="flex-shrink-0 pt-1">
                  {getNotificationIcon(notification.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <h3 className="font-semibold text-slate-900 text-base">
                      {notification.title}
                    </h3>
                    {!notification.is_read && (
                      <Badge className="bg-blue-600 text-white flex-shrink-0">
                        Neu
                      </Badge>
                    )}
                  </div>

                  <p className="text-slate-600 text-sm mb-2">
                    {notification.message}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="px-2 py-1 bg-slate-100 rounded">
                        {getNotificationTypeLabel(notification.type)}
                      </span>
                      <span>
                        {format(new Date(notification.created_date), 'dd. MMM HH:mm', {
                          locale: de
                        })}
                      </span>
                    </div>

                    <div className="flex gap-2">
                      {!notification.is_read && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsReadMutation.mutate(notification.id)}
                          className="text-blue-600 hover:text-blue-700 gap-1"
                        >
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="text-xs">Gelesen</span>
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteNotificationMutation.mutate(notification.id)}
                        className="text-slate-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}