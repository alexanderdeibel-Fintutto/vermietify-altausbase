import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, User, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function MobileMessaging({ tenantId }) {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['tenantMessages', tenantId],
    queryFn: () => base44.entities.TenantMessage.filter({ tenant_id: tenantId }, '-created_date', 50),
    enabled: !!tenantId,
    refetchInterval: 10000
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('sendTenantMessage', {
        tenant_id: tenantId,
        message: message,
        direction: 'from_tenant'
      });
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantMessages'] });
      setMessage('');
      toast.success('Nachricht gesendet');
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.created_date) - new Date(b.created_date)
  );

  return (
    <div className="flex flex-col h-[calc(100vh-220px)]">
      <Card className="flex-1 flex flex-col">
        <CardHeader className="border-b">
          <CardTitle className="text-base flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            Nachrichten
          </CardTitle>
        </CardHeader>
        
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
          {sortedMessages.length === 0 ? (
            <div className="text-center py-8 text-slate-600">
              <MessageSquare className="w-12 h-12 mx-auto mb-2 text-slate-400" />
              <p>Noch keine Nachrichten</p>
            </div>
          ) : (
            sortedMessages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.direction === 'from_tenant' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                    msg.direction === 'from_tenant'
                      ? 'bg-blue-600 text-white'
                      : 'bg-slate-100 text-slate-900'
                  }`}
                >
                  {msg.direction === 'to_tenant' && (
                    <div className="flex items-center gap-2 mb-1">
                      <User className="w-3 h-3" />
                      <span className="text-xs font-semibold">Verwaltung</span>
                    </div>
                  )}
                  <p className="text-sm">{msg.message}</p>
                  <p className={`text-xs mt-1 ${msg.direction === 'from_tenant' ? 'text-blue-100' : 'text-slate-500'}`}>
                    {new Date(msg.created_date).toLocaleTimeString('de-DE', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>

        <div className="p-4 border-t bg-white">
          <div className="flex gap-2">
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Nachricht schreiben..."
              rows={2}
              className="resize-none"
            />
            <Button
              onClick={() => sendMutation.mutate()}
              disabled={sendMutation.isPending || !message.trim()}
              className="bg-blue-600 hover:bg-blue-700 self-end"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}