import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Clock, User, MessageSquare, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function CommunicationAuditLog() {
  const [filterUser, setFilterUser] = useState('');
  const [filterAction, setFilterAction] = useState('all');

  const { data: messages = [] } = useQuery({
    queryKey: ['tenantMessages'],
    queryFn: () => base44.entities.TenantMessage.list('-updated_date', 500),
  });

  const logs = useMemo(() => {
    return messages.map(m => ({
      id: m.id,
      action: m.status === 'open' ? 'Nachricht erhalten' : 'Nachricht beantwortet',
      user: m.assigned_to ? 'Admin' : 'System',
      recipient: m.tenant_id,
      channel: 'Chat/System',
      date: new Date(m.updated_date).toLocaleString('de-DE'),
      details: m.subject || m.message.substring(0, 50),
    })).sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [messages]);

  const filteredLogs = logs.filter(log => {
    const userMatch = log.user.toLowerCase().includes(filterUser.toLowerCase()) || 
                      log.recipient.toLowerCase().includes(filterUser.toLowerCase());
    return userMatch;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Kommunikations-Audit-Log</h1>
          <p className="text-slate-600 font-light mt-2">Detaillierte Logs aller Kommunikationsereignisse ({filteredLogs.length})</p>
        </div>
        <Button variant="outline" size="sm">
          <Download className="w-4 h-4 mr-2" />
          Exportieren
        </Button>
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="pt-6 space-y-3">
          <Input
            placeholder="Nach Nutzer oder Empfänger filtern..."
            value={filterUser}
            onChange={(e) => setFilterUser(e.target.value)}
          />
        </CardContent>
      </Card>

      {/* Log-Einträge */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <Card>
            <CardContent className="pt-6 text-center text-slate-500">
              Keine Log-Einträge gefunden
            </CardContent>
          </Card>
        ) : (
          filteredLogs.map(log => (
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
                      <div className="flex items-center gap-1">
                        → Mieter
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {log.date}
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