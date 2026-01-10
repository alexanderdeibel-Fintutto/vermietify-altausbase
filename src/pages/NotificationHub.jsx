import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertCircle, Bell, Trash2, CheckCircle, Filter, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const typeIcons = {
  maintenance_assigned: '🔧',
  equipment_status_change: '⚠️',
  task_overdue: '⏰',
  tenant_communication: '💬',
  report_generated: '📊',
  system_alert: '🚨',
  payment: '💰',
  contract_expiry: '📋',
  critical_alert: '🚨'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-700 border-blue-300',
  normal: 'bg-slate-100 text-slate-700 border-slate-300',
  high: 'bg-orange-100 text-orange-700 border-orange-300',
  critical: 'bg-red-100 text-red-700 border-red-300'
};

export default function NotificationHub() {
  const queryClient = useQueryClient();
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterReadStatus, setFilterReadStatus] = useState('all');
  const [searchText, setSearchText] = useState('');

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['all-notifications', currentUser?.email],
    queryFn: async () => {
      if (!currentUser?.email) return [];
      return await base44.entities.Notification.filter(
        { user_email: currentUser.email },
        '-created_date',
        500
      );
    },
    enabled: !!currentUser?.email,
    refetchInterval: 30000
  });

  // Filter and group notifications
  const processed = useMemo(() => {
    let filtered = notifications;

    // Apply filters
    if (filterType !== 'all') {
      filtered = filtered.filter(n => n.type === filterType);
    }
    if (filterPriority !== 'all') {
      filtered = filtered.filter(n => n.priority === filterPriority);
    }
    if (filterReadStatus === 'unread') {
      filtered = filtered.filter(n => !n.is_read);
    } else if (filterReadStatus === 'read') {
      filtered = filtered.filter(n => n.is_read);
    }
    if (searchText) {
      filtered = filtered.filter(n =>
        n.title?.toLowerCase().includes(searchText.toLowerCase()) ||
        n.message?.toLowerCase().includes(searchText.toLowerCase())
      );
    }

    // Group by type
    const grouped = {};
    filtered.forEach(notif => {
      const key = notif.type || 'other';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(notif);
    });

    return { filtered, grouped };
  }, [notifications, filterType, filterPriority, filterReadStatus, searchText]);

  const markAsReadMutation = useMutation({
    mutationFn: (notificationId) =>
      base44.entities.Notification.update(notificationId, {
        is_read: true,
        read_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (notificationId) => base44.entities.Notification.delete(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = processed.filtered.filter(n => !n.is_read);
      return Promise.all(
        unread.map(n =>
          base44.entities.Notification.update(n.id, {
            is_read: true,
            read_at: new Date().toISOString()
          })
        )
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-notifications'] });
    }
  });

  const unreadCount = processed.filtered.filter(n => !n.is_read).length;
  const criticalCount = processed.filtered.filter(n => n.priority === 'critical' && !n.is_read).length;

  const getNotificationTypes = () => {
    const types = new Set(notifications.map(n => n.type));
    return Array.from(types);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Benachrichtigungszentrale</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie alle Ihre Benachrichtigungen an einem Ort</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllAsReadMutation.mutate()}>
            <CheckCircle className="w-4 h-4 mr-2" />
            Alle als gelesen ({unreadCount})
          </Button>
        )}
      </div>

      {/* Stats */}
      {criticalCount > 0 && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6 flex items-center gap-4">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div>
              <p className="font-semibold text-red-900">{criticalCount} kritische Benachrichtigungen</p>
              <p className="text-sm text-red-700">Erfordert sofortige Aufmerksamkeit</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Filter className="w-5 h-5" />
            Filter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Suche</label>
              <Input
                placeholder="Titel oder Nachricht..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Typ</label>
              <Select value={filterType} onValueChange={setFilterType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Typen</SelectItem>
                  {getNotificationTypes().map(type => (
                    <SelectItem key={type} value={type}>
                      {type.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Priorität</label>
              <Select value={filterPriority} onValueChange={setFilterPriority}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Prioritäten</SelectItem>
                  <SelectItem value="critical">Kritisch</SelectItem>
                  <SelectItem value="high">Hoch</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="low">Niedrig</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-700 mb-2 block">Status</label>
              <Select value={filterReadStatus} onValueChange={setFilterReadStatus}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="unread">Ungelesen</SelectItem>
                  <SelectItem value="read">Gelesen</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results Count */}
      <div className="text-sm text-slate-600">
        Zeige {processed.filtered.length} von {notifications.length} Benachrichtigungen
      </div>

      {/* Grouped Notifications */}
      {processed.filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-600">Keine Benachrichtigungen gefunden</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(processed.grouped).map(([type, notifs]) => (
            <Card key={type}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <span className="text-2xl">{typeIcons[type] || '📌'}</span>
                  {type.replace(/_/g, ' ')}
                  <Badge variant="outline">{notifs.length}</Badge>
                  {notifs.filter(n => !n.is_read).length > 0 && (
                    <Badge className="bg-blue-100 text-blue-700 ml-auto">
                      {notifs.filter(n => !n.is_read).length} neu
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {notifs.map(notif => (
                    <div
                      key={notif.id}
                      className={cn(
                        'p-4 rounded-lg border-2 transition-all hover:shadow-md',
                        !notif.is_read
                          ? 'bg-blue-50 border-blue-300 shadow-sm'
                          : 'bg-slate-50 border-slate-200'
                      )}
                    >
                      <div className="flex items-start gap-4">
                        {/* Critical Indicator */}
                        {notif.priority === 'critical' && (
                          <div className="flex-shrink-0">
                            <AlertCircle className="w-6 h-6 text-red-600 animate-pulse" />
                          </div>
                        )}

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-slate-900">{notif.title}</h3>
                              <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                            </div>
                            {!notif.is_read && (
                              <span className="h-3 w-3 bg-blue-600 rounded-full flex-shrink-0 mt-1"></span>
                            )}
                          </div>

                          {/* Metadata */}
                          <div className="flex items-center gap-2 mt-3 flex-wrap">
                            <Badge
                              className={`${priorityColors[notif.priority]} border`}
                              variant="outline"
                            >
                              {notif.priority}
                            </Badge>
                            <span className="text-xs text-slate-500">
                              {new Date(notif.created_date).toLocaleDateString('de-DE', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex-shrink-0 flex gap-2">
                          {!notif.is_read && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => markAsReadMutation.mutate(notif.id)}
                              className="h-8 w-8 p-0"
                              title="Als gelesen markieren"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteMutation.mutate(notif.id)}
                            className="h-8 w-8 p-0 text-slate-400 hover:text-red-600"
                            title="Löschen"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}