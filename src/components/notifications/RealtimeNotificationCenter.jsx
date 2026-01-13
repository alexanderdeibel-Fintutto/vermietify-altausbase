import React, { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function RealtimeNotificationCenter() {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Subscribe to real-time entity changes
    const unsubscribes = [
      base44.entities.Invoice.subscribe((event) => {
        if (event.type === 'create') {
          addNotification('🧾 Neue Rechnung', `Rechnung ${event.data.number} erstellt`);
        } else if (event.type === 'update' && event.data.status === 'overdue') {
          addNotification('⚠️ Rechnung fällig', `Rechnung ${event.data.number} ist fällig`, 'warning');
        }
      }),

      base44.entities.Contract.subscribe((event) => {
        if (event.type === 'update' && event.data.status === 'ending_soon') {
          addNotification('📋 Vertrag endet bald', `${event.data.tenant_name} - ${event.data.end_date}`, 'info');
        }
      }),

      base44.entities.MaintenanceTask.subscribe((event) => {
        if (event.type === 'create') {
          addNotification('🔧 Wartungsaufgabe', `Neue Aufgabe: ${event.data.title}`);
        }
      })
    ];

    return () => unsubscribes.forEach(unsub => unsub?.());
  }, []);

  const addNotification = (title, message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, title, message, type, timestamp: new Date() }]);

    // Auto-remove after 5 seconds
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <div className="fixed top-20 right-4 z-50 space-y-2 max-w-sm">
      {notifications.map(notif => (
        <Card
          key={notif.id}
          className={`shadow-lg border-l-4 animate-in slide-in-from-top-2 ${
            notif.type === 'warning' ? 'border-l-orange-500 bg-orange-50' :
            notif.type === 'error' ? 'border-l-red-500 bg-red-50' :
            'border-l-blue-500 bg-blue-50'
          }`}
        >
          <CardContent className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <p className="font-medium text-sm">{notif.title}</p>
                <p className="text-xs text-slate-600 mt-0.5">{notif.message}</p>
              </div>
              <button
                onClick={() => removeNotification(notif.id)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}