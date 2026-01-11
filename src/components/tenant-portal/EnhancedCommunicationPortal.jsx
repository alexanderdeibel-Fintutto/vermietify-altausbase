import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, User, Building } from 'lucide-react';

export default function EnhancedCommunicationPortal({ tenantId, companyId }) {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: communications = [] } = useQuery({
    queryKey: ['tenant-communications', tenantId],
    queryFn: () => base44.entities.TenantCommunication.filter({ 
      tenant_id: tenantId 
    }, '-created_date', 30)
  });

  const sendMessageMutation = useMutation({
    mutationFn: () =>
      base44.entities.TenantCommunication.create({
        tenant_id: tenantId,
        company_id: companyId,
        message: message,
        direction: 'tenant_to_manager',
        status: 'unread'
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenant-communications'] });
      setMessage('');
    }
  });

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600" />
            Nachricht senden
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Schreiben Sie Ihre Nachricht an die Hausverwaltung..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={6}
          />
          <Button
            onClick={() => sendMessageMutation.mutate()}
            disabled={!message.trim() || sendMessageMutation.isPending}
            className="w-full"
          >
            <Send className="w-4 h-4 mr-2" />
            Nachricht senden
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="w-5 h-5" />
            Nachrichtenverlauf
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 max-h-[500px] overflow-y-auto">
          {communications.map(comm => {
            const isFromTenant = comm.direction === 'tenant_to_manager';
            return (
              <div
                key={comm.id}
                className={`p-3 rounded ${isFromTenant ? 'bg-slate-800 text-white ml-8' : 'bg-slate-100 mr-8'}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  {isFromTenant ? (
                    <User className="w-4 h-4" />
                  ) : (
                    <Building className="w-4 h-4" />
                  )}
                  <span className="text-xs font-medium">
                    {isFromTenant ? 'Sie' : 'Hausverwaltung'}
                  </span>
                  <span className="text-xs opacity-70">
                    {new Date(comm.created_date).toLocaleDateString('de-DE')}
                  </span>
                </div>
                <p className="text-sm">{comm.message}</p>
                {comm.response && !isFromTenant && (
                  <div className="mt-2 pt-2 border-t border-slate-300">
                    <p className="text-xs opacity-80">{comm.response}</p>
                  </div>
                )}
              </div>
            );
          })}
          {communications.length === 0 && (
            <p className="text-center text-slate-600 py-8">Keine Nachrichten vorhanden</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}