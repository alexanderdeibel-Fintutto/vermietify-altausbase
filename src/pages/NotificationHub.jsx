import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Bell, Check, CheckCheck, Trash2, Filter, Settings } from 'lucide-react';
import { toast } from 'sonner';
import NotificationPreferencesDialog from '@/components/notifications/NotificationPreferencesDialog';

const typeConfig = {
  payment: { label: 'Zahlung', icon: '💰', color: 'bg-green-100 text-green-800' },
  maintenance: { label: 'Wartung', icon: '🔧', color: 'bg-blue-100 text-blue-800' },
  contract: { label: 'Vertrag', icon: '📄', color: 'bg-purple-100 text-purple-800' },
  message: { label: 'Nachricht', icon: '💬', color: 'bg-yellow-100 text-yellow-800' },
  document: { label: 'Dokument', icon: '📎', color: 'bg-orange-100 text-orange-800' },
  system: { label: 'System', icon: '⚙️', color: 'bg-slate-100 text-slate-800' }
};

const priorityConfig = {
  low: { label: 'Niedrig', color: 'bg-slate-100 text-slate-700' },
  normal: { label: 'Normal', color: 'bg-blue-100 text-blue-700' },
  high: { label: 'Hoch', color: 'bg-orange-100 text-orange-700' },
  critical: { label: 'Kritisch', color: 'bg-red-100 text-red-700' }
};

export default function NotificationHub() {
  const [typeFilter, setTypeFilter] = useState('all');
  const [priorityFilter, setPriorityFilter] = useState('all');
  const [showPreferences, setShowPreferences] = useState(false);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.email],
    queryFn: async () => {
      const notifs = await base44.entities.Notification.filter({ user_email: user.email });
      return notifs.sort((a, b) => new Date(b.created_date) - new Date(a.created_date));
    },
    enabled: !!user
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(
        unread.map(n => 
          base44.entities.Notification.update(n.id, {
            is_read: true,
            read_at: new Date().toISOString()
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Alle als gelesen markiert');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (notificationId) => {
      await base44.entities.Notification.delete({ id: notificationId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notifications']);
      toast.success('Benachrichtigung gelöscht');
    }
  });

  const filteredNotifications = notifications.filter(n => {
    if (typeFilter !== 'all' && n.type !== typeFilter) return false;
    if (priorityFilter !== 'all' && n.priority !== priorityFilter) return false;
    return true;
  });

  const unreadNotifications = filteredNotifications.filter(n => !n.is_read);
  const readNotifications = filteredNotifications.filter(n => n.is_read);

  const renderNotification = (notification) => {
    const config = typeConfig[notification.type] || typeConfig.system;
    const priorityConf = priorityConfig[notification.priority] || priorityConfig.normal;

    return (
      <div
        key={notification.id}
        className={`p-4 border rounded-lg ${notification.is_read ? 'bg-slate-50' : 'bg-white border-blue-200'}`}
      >
        <div className="flex items-start gap-3">
          <div className="text-2xl">{config.icon}</div>
          <div className="flex-1">
            <div className="flex items-start justify-between gap-2">
              <h3 className={`font-semibold ${notification.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                {notification.title}
              </h3>
              <div className="flex items-center gap-2">
                <Badge className={priorityConf.color} variant="outline">
                  {priorityConf.label}
                </Badge>
                <Badge className={config.color}>
                  {config.label}
                </Badge>
              </div>
            </div>
            <p className={`text-sm mt-1 ${notification.is_read ? 'text-slate-500' : 'text-slate-700'}`}>
              {notification.message}
            </p>
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-slate-500">
                {new Date(notification.created_date).toLocaleString('de-DE')}
              </span>
              <div className="flex items-center gap-2">
                {!notification.is_read && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => markAsReadMutation.mutate(notification.id)}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    Als gelesen
                  </Button>
                )}
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteMutation.mutate(notification.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center">
            <Bell className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Benachrichtigungen</h1>
            <p className="text-slate-600">
              {unreadNotifications.length} ungelesene Benachrichtigung{unreadNotifications.length !== 1 ? 'en' : ''}
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          {unreadNotifications.length > 0 && (
            <Button onClick={() => markAllAsReadMutation.mutate()} variant="outline">
              <CheckCheck className="w-4 h-4 mr-2" />
              Alle als gelesen
            </Button>
          )}
          <Button onClick={() => setShowPreferences(true)} variant="outline">
            <Settings className="w-4 h-4 mr-2" />
            Einstellungen
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filter
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="text-sm font-semibold mb-2 block">Typ</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  {Object.entries(typeConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                      {config.icon} {config.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <label className="text-sm font-semibold mb-2 block">Priorität</label>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Prioritäten</SelectItem>
                  {Object.entries(priorityConfig).map(([key, config]) => (
                    <SelectItem key={key} value={key}>{config.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="unread">
        <TabsList>
          <TabsTrigger value="unread">
            Ungelesen ({unreadNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="read">
            Gelesen ({readNotifications.length})
          </TabsTrigger>
          <TabsTrigger value="all">
            Alle ({filteredNotifications.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="unread" className="space-y-3">
          {unreadNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCheck className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-slate-600">Keine ungelesenen Benachrichtigungen</p>
              </CardContent>
            </Card>
          ) : (
            unreadNotifications.map(renderNotification)
          )}
        </TabsContent>

        <TabsContent value="read" className="space-y-3">
          {readNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-slate-600">Keine gelesenen Benachrichtigungen</p>
              </CardContent>
            </Card>
          ) : (
            readNotifications.map(renderNotification)
          )}
        </TabsContent>

        <TabsContent value="all" className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600">Keine Benachrichtigungen</p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map(renderNotification)
          )}
        </TabsContent>
      </Tabs>

      {showPreferences && (
        <NotificationPreferencesDialog onClose={() => setShowPreferences(false)} />
      )}
    </div>
  );
}