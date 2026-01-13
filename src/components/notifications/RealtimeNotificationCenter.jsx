import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function RealtimeNotificationCenter() {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    // Subscribe to real-time updates
    const setupSubscriptions = async () => {
      // Invoice updates
      const unsubInvoices = base44.entities.Invoice.subscribe((event) => {
        if (event.type === 'create') {
          addNotification({
            type: 'invoice_created',
            title: '🧾 Neue Rechnung',
            message: `${event.data.title || 'Rechnung'} erstellt`,
            icon: '🧾'
          });
        }
      });

      // Building updates
      const unsubBuildings = base44.entities.Building.subscribe((event) => {
        if (event.type === 'update') {
          addNotification({
            type: 'building_updated',
            title: '🏢 Gebäude aktualisiert',
            message: event.data.name,
            icon: '🏢'
          });
        }
      });

      // Contract updates
      const unsubContracts = base44.entities.LeaseContract.subscribe((event) => {
        if (event.type === 'create') {
          addNotification({
            type: 'contract_created',
            title: '📋 Neuer Vertrag',
            message: `Vertrag für ${event.data.title || 'Unit'}`,
            icon: '📋'
          });
        }
      });

      return () => {
        unsubInvoices();
        unsubBuildings();
        unsubContracts();
      };
    };

    setupSubscriptions();
  }, []);

  const addNotification = (notif) => {
    const id = Date.now();
    const notification = { ...notif, id, read: false };
    
    setNotifications(prev => [notification, ...prev].slice(0, 10));
    setUnreadCount(prev => prev + 1);

    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);

    // Also show toast
    toast.success(notif.message);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  return (
    <div className="fixed bottom-4 right-4 w-full md:w-96 space-y-2 max-h-96 overflow-y-auto z-50">
      {/* Notification List */}
      {notifications.map(notif => (
        <Card key={notif.id} className={notif.read ? 'bg-slate-50' : 'bg-blue-50 border-blue-200'}>
          <CardContent className="p-3 flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-lg">{notif.icon}</span>
                <p className="font-medium text-sm">{notif.title}</p>
              </div>
              <p className="text-xs text-slate-600 mt-1">{notif.message}</p>
            </div>
            <Button
              size="icon"
              variant="ghost"
              onClick={() => removeNotification(notif.id)}
              className="h-6 w-6"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardContent>
        </Card>
      ))}

      {/* Mark as read button */}
      {unreadCount > 0 && (
        <Button
          size="sm"
          variant="outline"
          onClick={markAllAsRead}
          className="w-full"
        >
          ✓ Alle als gelesen
        </Button>
      )}
    </div>
  );
}