import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, Check } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';

export default function NotificationCard({ notification, onMarkAsRead, onDelete }) {
  const getTypeColor = (type) => {
    switch(type) {
      case 'payment': return 'bg-green-50 border-green-200';
      case 'contract': return 'bg-blue-50 border-blue-200';
      case 'maintenance': return 'bg-orange-50 border-orange-200';
      default: return 'bg-slate-50 border-slate-200';
    }
  };

  const getTypeLabel = (type) => {
    switch(type) {
      case 'payment': return '💰 Zahlung';
      case 'contract': return '📋 Vertrag';
      case 'maintenance': return '🔧 Wartung';
      default: return '📢 Info';
    }
  };

  return (
    <Card className={`border p-4 ${getTypeColor(notification.type)} ${!notification.is_read ? 'ring-2 ring-offset-2 ring-slate-400' : ''}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-sm font-semibold text-slate-700">{getTypeLabel(notification.type)}</span>
            {!notification.is_read && <span className="w-2 h-2 bg-slate-600 rounded-full"></span>}
          </div>
          <h3 className="font-semibold text-slate-900">{notification.title || '—'}</h3>
          <p className="text-sm text-slate-600 mt-1">{notification.message || '—'}</p>
          <p className="text-xs text-slate-500 mt-2">{notification.created_date ? format(new Date(notification.created_date), 'dd.MM.yyyy HH:mm', { locale: de }) : '—'}</p>
        </div>
        <div className="flex gap-2">
          {!notification.is_read && (
            <Button size="icon" variant="ghost" onClick={() => onMarkAsRead?.(notification)}>
              <Check className="w-4 h-4 text-green-600" />
            </Button>
          )}
          <Button size="icon" variant="ghost" onClick={() => onDelete?.(notification)}>
            <Trash2 className="w-4 h-4 text-red-600" />
          </Button>
        </div>
      </div>
    </Card>
  );
}