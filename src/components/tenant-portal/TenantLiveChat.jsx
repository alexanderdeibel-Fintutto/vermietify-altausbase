import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantLiveChat({ tenantId, tenant }) {
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const queryClient = useQueryClient();
  const scrollRef = useRef(null);

  const { data: communications = [] } = useQuery({
    queryKey: ['tenantCommunications', tenantId],
    queryFn: () => base44.entities.TenantCommunication.filter(
      { tenant_id: tenantId },
      'created_at',
      100
    ),
    refetchInterval: 3000
  });

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [communications]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    setIsSubmitting(true);
    try {
      await base44.functions.invoke('sendTenantMessage', {
        tenant_id: tenantId,
        message_text: message,
        sender: 'tenant'
      });

      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['tenantCommunications', tenantId] });
      toast.success('Nachricht gesendet');
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader>
        <CardTitle className="text-base">Kommunikation mit dem Team</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
        {/* Messages Container */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-3 pb-4">
          {communications.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-400">
              <p>Noch keine Nachrichten. Starte eine Konversation!</p>
            </div>
          ) : (
            communications.map(msg => (
              <div key={msg.id} className={`flex ${msg.sender === 'tenant' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  msg.sender === 'tenant'
                    ? 'bg-blue-600 text-white rounded-br-none'
                    : 'bg-slate-100 text-slate-900 rounded-bl-none'
                }`}>
                  <p className="text-sm font-semibold mb-1 opacity-75">
                    {msg.sender === 'tenant' ? 'Du' : 'Team'}
                  </p>
                  <p className="text-sm">{msg.message_text}</p>
                  <p className="text-xs mt-1 opacity-60">
                    {new Date(msg.created_at).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Message Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2 border-t border-slate-200 pt-3">
          <Input
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Schreibe eine Nachricht..."
            disabled={isSubmitting}
            className="flex-1"
          />
          <Button
            type="submit"
            disabled={isSubmitting || !message.trim()}
            size="icon"
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}