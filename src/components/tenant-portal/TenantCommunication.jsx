import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantCommunication({ leaseId, tenantEmail }) {
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState('INQUIRY');
  const [loading, setLoading] = useState(false);

  const { data: messages = [], refetch } = useQuery({
    queryKey: ['tenantMessages', leaseId],
    queryFn: async () => {
      const all = await base44.entities.TenantMessage.list();
      return all.filter(m => m.lease_contract_id === leaseId).sort((a, b) => 
        new Date(b.sent_date) - new Date(a.sent_date)
      );
    }
  });

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) {
      toast.error('Nachricht kann nicht leer sein');
      return;
    }

    setLoading(true);
    try {
      await base44.entities.TenantMessage.create({
        lease_contract_id: leaseId,
        tenant_email: tenantEmail,
        message_type: messageType,
        subject: messageType === 'INQUIRY' ? 'Anfrage' : messageType === 'COMPLAINT' ? 'Beschwerde' : 'Nachricht',
        content: newMessage,
        sent_date: new Date().toISOString(),
        status: 'SENT',
        priority: 'MEDIUM'
      });

      setNewMessage('');
      toast.success('Nachricht gesendet');
      refetch();
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const messageTypeLabels = {
    INQUIRY: 'Anfrage',
    COMPLAINT: 'Beschwerde',
    MAINTENANCE_REQUEST: 'Wartung'
  };

  const getStatusColor = (status) => {
    if (status === 'REPLIED') return 'bg-green-100 text-green-800';
    if (status === 'RESOLVED') return 'bg-blue-100 text-blue-800';
    return 'bg-yellow-100 text-yellow-800';
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Neue Nachricht</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendMessage} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nachrichtentyp</label>
              <select
                value={messageType}
                onChange={(e) => setMessageType(e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              >
                <option value="INQUIRY">Anfrage</option>
                <option value="COMPLAINT">Beschwerde</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Nachricht</label>
              <textarea
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Ihre Nachricht..."
                rows="4"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700">
              <Send className="w-4 h-4 mr-2" />
              Senden
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Nachrichtenhistorie</CardTitle>
        </CardHeader>
        <CardContent>
          {messages.length > 0 ? (
            <div className="space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className="p-3 border rounded hover:bg-gray-50">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-medium text-sm">{messageTypeLabels[msg.message_type]}</p>
                      <p className="text-xs text-gray-600">
                        {new Date(msg.sent_date).toLocaleDateString('de-DE', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${getStatusColor(msg.status)}`}>
                      {msg.status === 'REPLIED' ? 'Beantwortet' : msg.status === 'RESOLVED' ? 'Gelöst' : 'Ausstehend'}
                    </span>
                  </div>
                  <p className="text-sm text-gray-700">{msg.content}</p>
                  {msg.reply_content && (
                    <div className="mt-3 p-2 bg-blue-50 rounded border-l-2 border-blue-600">
                      <p className="text-xs font-medium text-blue-900 mb-1">Antwort:</p>
                      <p className="text-sm text-gray-700">{msg.reply_content}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-600">
              <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Keine Nachrichten vorhanden</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}