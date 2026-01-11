import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Mail, MessageSquare, Bell, Clock, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function NotificationHistory() {
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data: notifications = [] } = useQuery({
    queryKey: ['tenantNotifications'],
    queryFn: () => base44.entities.TenantNotification.list('-updated_date', 200),
  });

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

  const typeMap = {
    invoice: 'email',
    operating_costs: 'email',
    announcement: 'bell',
    payment_reminder: 'email',
    other: 'message',
  };

  const filteredNotifications = notifications.filter(n => {
    const typeMatch = filterType === 'all' || typeMap[n.type] === typeMap[filterType];
    const searchMatch = searchTerm === '' || 
      n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      n.message.toLowerCase().includes(searchTerm.toLowerCase());
    return typeMatch && searchMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Benachrichtigungs-Verlauf</h1>
          <p className="text-slate-600 font-light mt-2">Übersicht aller versendeten Benachrichtigungen ({filteredNotifications.length})</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportieren
        </Button>
      </div>

      {/* Filter & Suche */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex gap-2 flex-wrap">
            {['all', 'email', 'announcement', 'payment_reminder'].map(type => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg transition-all text-sm ${
                  filterType === type
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {type === 'all' ? 'Alle' : type === 'email' ? 'E-Mail' : type === 'announcement' ? 'Ankündigung' : 'Zahlungserinnerung'}
              </button>
            ))}
          </div>
          <Input
            placeholder="Nach Titel oder Inhalt suchen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Verlauf */}
      <div className="space-y-3">
        {filteredNotifications.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Benachrichtigungen gefunden
            </CardContent>
          </Card>
        ) : (
          filteredNotifications.map(notif => (
            <Card key={notif.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4 flex-1">
                    <div className="p-2 bg-slate-100 rounded-lg mt-1">
                      {notif.type === 'invoice' || notif.type === 'payment_reminder' ? (
                        <Mail className="w-4 h-4" />
                      ) : notif.type === 'announcement' ? (
                        <Bell className="w-4 h-4" />
                      ) : (
                        <MessageSquare className="w-4 h-4" />
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-slate-900">{notif.title}</h3>
                      <p className="text-sm text-slate-600 mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-slate-500 mt-2">{notif.related_entity_type && `Typ: ${notif.related_entity_type}`}</p>
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
                      <Clock className="w-3 h-3" />
                      {new Date(notif.updated_date).toLocaleDateString('de-DE')}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded font-medium ${
                      notif.is_read
                        ? 'bg-slate-100 text-slate-700'
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {notif.is_read ? 'Gelesen' : 'Ungelesen'}
                    </span>
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