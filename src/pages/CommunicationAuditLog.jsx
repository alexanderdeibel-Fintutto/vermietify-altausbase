import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Clock, User, MessageSquare } from 'lucide-react';

export default function CommunicationAuditLog() {
  const [filterUser, setFilterUser] = useState('');

  const logs = [
    { id: 1, action: 'Nachricht versendet', user: 'Admin', recipient: 'Max Müller', channel: 'Email', date: '2026-01-10 14:35', details: 'Zahlungserinnerung' },
    { id: 2, action: 'Nachricht gelesen', user: 'Max Müller', recipient: '-', channel: 'Email', date: '2026-01-10 15:22', details: 'Zahlungserinnerung' },
    { id: 3, action: 'Chat-Nachricht', user: 'Anna Schmidt', recipient: 'Admin', channel: 'Chat', date: '2026-01-10 16:00', details: 'Wartungsanfrage' },
    { id: 4, action: 'Vorlage erstellt', user: 'Admin', recipient: '-', channel: 'System', date: '2026-01-09 09:15', details: 'Neue E-Mail-Vorlage' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Kommunikations-Audit-Log</h1>
        <p className="text-slate-600 font-light mt-2">Detaillierte Logs aller Kommunikationsereignisse</p>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6">
          <Input
            placeholder="Nach Nutzer filtern..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Log-Einträge */}
      <div className="space-y-3">
        {logs.map(log => (
          <Card key={log.id}>
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <MessageSquare className="w-4 h-4 text-slate-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-slate-900">{log.action}</h3>
                      <p className="text-sm text-slate-600 mt-1">{log.details}</p>
                    </div>
                    <span className="text-xs px-2 py-1 bg-slate-100 rounded">{log.channel}</span>
                  </div>
                  <div className="flex gap-4 mt-3 text-xs text-slate-500">
                    <div className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {log.user}
                    </div>
                    {log.recipient !== '-' && (
                      <div className="flex items-center gap-1">
                        → {log.recipient}
                      </div>
                    )}
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {log.date}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}