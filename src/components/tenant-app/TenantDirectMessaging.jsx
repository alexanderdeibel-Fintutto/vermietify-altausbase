import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Send, User } from 'lucide-react';

export default function TenantDirectMessaging({ tenantId, companyId }) {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['tenant-messages', tenantId],
    queryFn: () => base44.entities.TenantCommunication.filter({ tenant_id: tenantId }, '-created_date', 20)
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
      queryClient.invalidateQueries({ queryKey: ['tenant-messages'] });
      setMessage('');
    }
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Nachricht an Verwalter</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Ihre Nachricht..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={!message.trim()}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Senden
          </Button>
        </CardContent>
      </Card>

      <div className="space-y-2">
        {messages.map(msg => (
          <Card key={msg.id} className={msg.sender_type === 'tenant' ? 'ml-8' : 'mr-8'}>
            <CardContent className="pt-3">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-3 h-3 text-slate-600" />
                <span className="text-xs text-slate-600">
                  {msg.sender_type === 'tenant' ? 'Sie' : 'Verwaltung'}
                </span>
                <span className="text-xs text-slate-400">
                  {new Date(msg.timestamp || msg.created_date).toLocaleString('de-DE')}
                </span>
              </div>
              <p className="text-sm">{msg.message}</p>
              {msg.response && (
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs">
                  <p className="font-medium text-blue-900">Antwort:</p>
                  <p className="text-slate-700">{msg.response}</p>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}