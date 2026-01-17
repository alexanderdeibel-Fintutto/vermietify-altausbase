import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { cn } from '@/lib/utils';
import { Bell, CheckCheck, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  VfDropdown,
  VfDropdownTrigger,
  VfDropdownContent,
  VfDropdownItem
} from '@/components/ui/vf-dropdown';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export function VfNotificationCenter() {
  const [filter, setFilter] = useState('all');
  
  const { data: notifications = [], refetch } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const data = await base44.entities.Notification.list('-created_date', 50);
      return data;
    }
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    if (filter !== 'all') return n.type === filter;
    return true;
  });

  const handleMarkAllRead = async () => {
    for (const notif of notifications.filter(n => !n.read)) {
      await base44.entities.Notification.update(notif.id, { read: true });
    }
    refetch();
  };

  return (
    <div className="vf-notification-center">
      <div className="vf-notification-center__header">
        <div className="vf-notification-center__title">
          Benachrichtigungen
          {unreadCount > 0 && (
            <span className="ml-2 text-xs px-2 py-0.5 bg-[var(--vf-error-500)] text-white rounded-full">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <VfDropdown>
            <VfDropdownTrigger asChild>
              <button className="p-1 hover:bg-[var(--theme-surface-hover)] rounded">
                <Filter className="h-4 w-4" />
              </button>
            </VfDropdownTrigger>
            <VfDropdownContent>
              <VfDropdownItem onClick={() => setFilter('all')}>Alle</VfDropdownItem>
              <VfDropdownItem onClick={() => setFilter('unread')}>Ungelesen</VfDropdownItem>
              <VfDropdownItem onClick={() => setFilter('payment')}>Zahlungen</VfDropdownItem>
              <VfDropdownItem onClick={() => setFilter('contract')}>Verträge</VfDropdownItem>
              <VfDropdownItem onClick={() => setFilter('task')}>Aufgaben</VfDropdownItem>
            </VfDropdownContent>
          </VfDropdown>
          
          {unreadCount > 0 && (
            <button 
              onClick={handleMarkAllRead}
              className="p-1 hover:bg-[var(--theme-surface-hover)] rounded"
              title="Alle als gelesen markieren"
            >
              <CheckCheck className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
      
      <div className="vf-notification-center__body">
        {filteredNotifications.length === 0 ? (
          <div className="p-8 text-center text-[var(--theme-text-muted)]">
            <Bell className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Keine Benachrichtigungen</p>
          </div>
        ) : (
          filteredNotifications.map((notif) => (
            <VfNotification 
              key={notif.id} 
              notification={notif}
              onRead={() => {
                if (!notif.read) {
                  base44.entities.Notification.update(notif.id, { read: true });
                  refetch();
                }
              }}
            />
          ))
        )}
      </div>
      
      <div className="vf-notification-center__footer">
        <button className="text-sm text-[var(--theme-primary)] hover:underline">
          Alle anzeigen
        </button>
      </div>
    </div>
  );
}

export function VfNotification({ notification, onRead }) {
  const getIconClass = (type) => {
    switch (type) {
      case 'payment': return 'vf-notification__icon--payment';
      case 'alert': return 'vf-notification__icon--alert';
      case 'task': return 'vf-notification__icon--task';
      case 'document': return 'vf-notification__icon--document';
      default: return 'vf-notification__icon--task';
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_date), {
    addSuffix: true,
    locale: de
  });

  return (
    <div 
      className={cn(
        "vf-notification",
        !notification.read && "vf-notification--unread"
      )}
      onClick={onRead}
    >
      <div className="vf-notification__header">
        <div className={cn("vf-notification__icon", getIconClass(notification.type))}>
          <Bell className="h-4 w-4" />
        </div>
        <div className="vf-notification__content">
          <div className="vf-notification__title">{notification.title}</div>
          <div className="vf-notification__message">{notification.message}</div>
          <div className="vf-notification__time">{timeAgo}</div>
        </div>
      </div>
    </div>
  );
}