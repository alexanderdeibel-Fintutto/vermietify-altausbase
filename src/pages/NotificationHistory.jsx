import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mail, MessageSquare, Bell, Clock } from 'lucide-react';

export default function NotificationHistory() {
  const [filterType, setFilterType] = useState('all');

  const notifications = [
    { id: 1, type: 'email', title: 'Zahlungserinnerung', recipient: 'Max Müller', date: '2026-01-10', status: 'sent' },
    { id: 2, type: 'sms', title: 'Wartungstermin', recipient: 'Anna Schmidt', date: '2026-01-10', status: 'sent' },
    { id: 3, type: 'push', title: 'Neue Ankündigung', recipient: 'Alle Mieter', date: '2026-01-09', status: 'sent' },
    { id: 4, type: 'email', title: 'Vertragsverlängerung', recipient: 'Thomas Weber', date: '2026-01-09', status: 'failed' },
  ];

  const getIcon = (type) => {
    switch(type) {
      case 'email': return <Mail className="w-4 h-4" />;
      case 'sms': return <MessageSquare className="w-4 h-4" />;
      case 'push': return <Bell className="w-4 h-4" />;
      default: return null;
    }
  };

  const getTypeLabel = (type) => {
    const labels = { email: 'E-Mail', sms: 'SMS', push: 'Push' };
    return labels[type] || type;
  };

  const filteredNotifications = filterType === 'all' 
    ? notifications 
    : notifications.filter(n => n.type === filterType);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Benachrichtigungs-Verlauf</h1>
        <p className="text-slate-600 font-light mt-2">Übersicht aller versendeten Benachrichtigungen</p>
      </div>

      {/* Filter */}
      <div className="flex gap-2 flex-wrap">
        {['all', 'email', 'sms', 'push'].map(type => (
          <button
            key={type}
            onClick={() => setFilterType(type)}
            className={`px-4 py-2 rounded-lg transition-all ${
              filterType === type
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {type === 'all' ? 'Alle' : getTypeLabel(type)}
          </button>
        ))}
      </div>

      {/* Verlauf */}
      <div className="space-y-3">
        {filteredNotifications.map(notif => (
          <Card key={notif.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-start gap-4">
                  <div className="p-2 bg-slate-100 rounded-lg">
                    {getIcon(notif.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-slate-900">{notif.title}</h3>
                    <p className="text-sm text-slate-600">{notif.recipient}</p>
                  </div>
                </div>
                <div className="text-right">
                  <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                    <Clock className="w-3 h-3" />
                    {notif.date}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded ${
                    notif.status === 'sent'
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {notif.status === 'sent' ? 'Versendet' : 'Fehler'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}