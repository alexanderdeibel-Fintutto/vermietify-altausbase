import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, CheckCircle, AlertCircle, FileText, Wrench, MessageSquare, Calendar } from 'lucide-react';
import { toast } from 'sonner';

export default function MobileNotifications({ userEmail }) {
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications', userEmail],
    queryFn: () => base44.entities.Notification.filter({ user_email: userEmail }, '-created_date', 50),
    enabled: !!userEmail
  });

  const markReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { 
      is_read: true,
      read_at: new Date().toISOString()
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    }
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        base44.entities.Notification.update(n.id, { 
          is_read: true,
          read_at: new Date().toISOString()
        })
      ));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast.success('Alle als gelesen markiert');
    }
  });

  const getIcon = (type) => {
    switch (type) {
      case 'maintenance': return <Wrench className="w-5 h-5 text-orange-600" />;
      case 'message': return <MessageSquare className="w-5 h-5 text-blue-600" />;
      case 'contract': return <FileText className="w-5 h-5 text-purple-600" />;
      case 'payment': return <Calendar className="w-5 h-5 text-green-600" />;
      default: return <Bell className="w-5 h-5 text-slate-600" />;
    }
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    normal: 'bg-slate-100 text-slate-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">
          Benachrichtigungen
          {unreadCount > 0 && (
            <Badge className="ml-2 bg-red-500 text-white">{unreadCount}</Badge>
          )}
        </h2>
        {unreadCount > 0 && (
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => markAllReadMutation.mutate()}
            disabled={markAllReadMutation.isPending}
          >
            Alle gelesen
          </Button>
        )}
      </div>

      <div className="space-y-2">
        {notifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              <Bell className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <p>Keine Benachrichtigungen</p>
            </CardContent>
          </Card>
        ) : (
          notifications.map(notification => (
            <Card 
              key={notification.id} 
              className={`${!notification.is_read ? 'border-l-4 border-l-blue-600 bg-blue-50' : ''}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1">
                    {getIcon(notification.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <h4 className="font-semibold text-sm">{notification.title}</h4>
                      {notification.priority !== 'normal' && (
                        <Badge className={priorityColors[notification.priority]}>
                          {notification.priority}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{notification.message}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-slate-500">
                        {new Date(notification.created_date).toLocaleString('de-DE')}
                      </span>
                      {!notification.is_read && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => markReadMutation.mutate(notification.id)}
                          className="text-xs h-6"
                        >
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Als gelesen
                        </Button>
                      )}
                    </div>
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