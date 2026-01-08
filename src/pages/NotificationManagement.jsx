import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from "@/components/ui/button";
import NotificationFilterBar from '@/components/notifications/NotificationFilterBar';
import NotificationCard from '@/components/notifications/NotificationCard';
import QuickStats from '@/components/shared/QuickStats';
import { Trash2 } from 'lucide-react';

export default function NotificationManagementPage() {
  const [search, setSearch] = useState('');
  const [type, setType] = useState('all');
  const [status, setStatus] = useState('all');
  const queryClient = useQueryClient();

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => base44.entities.Notification?.list?.() || []
  });

  const markAsReadMutation = useMutation({
    mutationFn: (notif) => base44.entities.Notification.update(notif.id, { is_read: true }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => base44.entities.Notification.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['notifications'] })
  });

  const filteredNotifications = notifications.filter(n => {
    const matchesSearch = (n.title || '').toLowerCase().includes(search.toLowerCase());
    const matchesType = type === 'all' || n.type === type;
    const matchesStatus = status === 'all' || (status === 'unread' ? !n.is_read : n.is_read);
    return matchesSearch && matchesType && matchesStatus;
  });

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const totalCount = notifications.length;

  const stats = [
    { label: 'Gesamtbenachrichtigungen', value: totalCount },
    { label: 'Ungelesen', value: unreadCount },
    { label: 'Gelesen', value: totalCount - unreadCount },
    { label: 'Heute', value: notifications.filter(n => {
      const today = new Date();
      const notifDate = new Date(n.created_date);
      return notifDate.toDateString() === today.toDateString();
    }).length },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">🔔 Benachrichtigungen</h1>
          <p className="text-slate-600 mt-1">Verwalten Sie alle Benachrichtigungen und Alerts</p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={() => notifications.filter(n => !n.is_read).forEach(n => markAsReadMutation.mutate(n))}>
            Alle als gelesen markieren
          </Button>
        )}
      </div>

      <QuickStats stats={stats} accentColor="amber" />
      <NotificationFilterBar onSearchChange={setSearch} onTypeChange={setType} onStatusChange={setStatus} />
      
      <div className="space-y-3">
        {filteredNotifications.length > 0 ? (
          filteredNotifications.map((notif, idx) => (
            <NotificationCard key={idx} notification={notif} onMarkAsRead={(n) => markAsReadMutation.mutate(n)} onDelete={(n) => deleteMutation.mutate(n.id)} />
          ))
        ) : (
          <div className="text-center py-12">
            <p className="text-slate-600">Keine Benachrichtigungen</p>
          </div>
        )}
      </div>
    </div>
  );
}