import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User, Bot } from 'lucide-react';

export default function TenantCommunicationHub({ tenantId, companyId }) {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: communications = [] } = useQuery({
    queryKey: ['tenant-communications', tenantId],
    queryFn: () => base44.entities.TenantCommunication.filter({ tenant_id: tenantId }, '-created_date', 30)
  });

  const sendMutation = useMutation({
    mutationFn: () =>
      base44.entities.TenantCommunication.create({
        tenant_id: tenantId,
        company_id: companyId,
        message,
        sender_type: 'tenant',
        status: 'sent',
        timestamp: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-communications'] });
      setMessage('');
    }
  });

  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          Kommunikation mit Verwalter
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto space-y-3 mb-4 max-h-96">
          {communications.length === 0 ? (
            <div className="text-center py-8">
              <Bot className="w-12 h-12 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-600">Noch keine Nachrichten</p>
              <p className="text-xs text-slate-500 mt-1">Starten Sie eine Konversation</p>
            </div>
          ) : (
            communications.map(comm => (
              <div key={comm.id} className={`flex gap-3 ${comm.sender_type === 'tenant' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[70%] ${comm.sender_type === 'tenant' ? 'order-2' : 'order-1'}`}>
                  <div className={`p-3 rounded-lg ${
                    comm.sender_type === 'tenant' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-slate-100 text-slate-900'
                  }`}>
                    <p className="text-sm">{comm.message}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1 px-1">
                    {comm.sender_type === 'tenant' ? <User className="w-3 h-3 text-slate-400" /> : <Bot className="w-3 h-3 text-slate-400" />}
                    <span className="text-xs text-slate-500">
                      {new Date(comm.timestamp || comm.created_date).toLocaleString('de-DE')}
                    </span>
                    {comm.status === 'read' && comm.sender_type === 'tenant' && (
                      <Badge className="text-xs bg-green-100 text-green-800">Gelesen</Badge>
                    )}
                  </div>
                  {comm.response && (
                    <div className="mt-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <p className="text-xs font-medium text-green-900 mb-1">Antwort vom Verwalter:</p>
                      <p className="text-sm text-green-800">{comm.response}</p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="border-t pt-4">
          <Textarea
            placeholder="Nachricht an Ihren Verwalter schreiben..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={3}
            className="mb-2"
          />
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={!message.trim() || sendMutation.isPending}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Nachricht senden
          </Button>
          <p className="text-xs text-slate-500 mt-2 text-center">
            💬 Schnellanfragen werden automatisch vom Vermieter-Assistent bearbeitet
          </p>
        </div>
      </CardContent>
    </Card>
  );
}