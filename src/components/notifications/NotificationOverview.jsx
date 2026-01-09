import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell, Search, Trash2, CheckCircle, Filter } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationOverview() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [filterRead, setFilterRead] = useState('all');
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: notifications = [] } = useQuery({
    queryKey: ['allNotifications', user?.email],
    queryFn: () => base44.entities.Notification.filter({ user_email: user.email }, '-created_date', 200),
    enabled: !!user?.email
  });

  const markAsReadMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.update(id, { is_read: true, read_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      toast.success('Benachrichtigung gelöscht');
    }
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const unread = filteredNotifications.filter(n => !n.is_read);
      for (const notif of unread) {
        await base44.entities.Notification.update(notif.id, { is_read: true, read_at: new Date().toISOString() });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['allNotifications'] });
      toast.success('Alle als gelesen markiert');
    }
  });

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = !searchQuery || 
      n.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      n.message?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || n.type === filterType;
    const matchesPriority = filterPriority === 'all' || n.priority === filterPriority;
    const matchesRead = filterRead === 'all' || 
      (filterRead === 'unread' && !n.is_read) ||
      (filterRead === 'read' && n.is_read);
    return matchesSearch && matchesType && matchesPriority && matchesRead;
  });

  const typeIcons = {
    payment: '💰',
    maintenance: '🔧',
    contract: '📄',
    message: '💬',
    ticket: '🎫',
    system: '⚙️'
  };

  const priorityColors = {
    low: 'bg-blue-100 text-blue-800',
    normal: 'bg-slate-100 text-slate-800',
    high: 'bg-orange-100 text-orange-800',
    critical: 'bg-red-100 text-red-800'
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-light text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6" />
            Benachrichtigungen
          </h1>
          <p className="text-sm text-slate-600 mt-1">{unreadCount} ungelesene</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllAsReadMutation.mutate()} variant="outline">
            <CheckCircle className="w-4 h-4 mr-2" />
            Alle als gelesen
          </Button>
        )}
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Suchen..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger>
                <SelectValue placeholder="Typ" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Typen</SelectItem>
                <SelectItem value="payment">Zahlungen</SelectItem>
                <SelectItem value="maintenance">Wartung</SelectItem>
                <SelectItem value="contract">Verträge</SelectItem>
                <SelectItem value="message">Nachrichten</SelectItem>
                <SelectItem value="ticket">Tickets</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger>
                <SelectValue placeholder="Priorität" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Prioritäten</SelectItem>
                <SelectItem value="critical">Kritisch</SelectItem>
                <SelectItem value="high">Hoch</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="low">Niedrig</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterRead} onValueChange={setFilterRead}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle</SelectItem>
                <SelectItem value="unread">Ungelesen</SelectItem>
                <SelectItem value="read">Gelesen</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <div className="space-y-2">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-600">
              Keine Benachrichtigungen gefunden
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map(notif => (
            <Card key={notif.id} className={`${!notif.is_read ? 'border-blue-500 bg-blue-50' : ''} hover:shadow-md transition-shadow`}>
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl mt-1">{typeIcons[notif.type] || '📌'}</span>
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-medium text-slate-900">{notif.title}</h3>
                        <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                      </div>
                      <Badge className={priorityColors[notif.priority]}>
                        {notif.priority}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <p className="text-xs text-slate-500">
                        {new Date(notif.created_date).toLocaleString('de-DE')}
                      </p>
                      <div className="flex items-center gap-2">
                        {!notif.is_read && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => markAsReadMutation.mutate(notif.id)}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Als gelesen
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => deleteMutation.mutate(notif.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
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