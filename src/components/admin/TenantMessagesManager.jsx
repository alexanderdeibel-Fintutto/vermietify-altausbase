import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send, User, Reply } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantMessagesManager() {
  const [replyTo, setReplyTo] = useState(null);
  const [replyMessage, setReplyMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['all-tenant-messages'],
    queryFn: async () => {
      const msgs = await base44.entities.TenantMessage.list('-created_date', 100);
      return msgs;
    },
    refetchInterval: 10000
  });

  const replyMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('replyToTenantMessage', {
        tenant_id: replyTo.tenant_id,
        message: replyMessage
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['all-tenant-messages']);
      setReplyTo(null);
      setReplyMessage('');
      toast.success('Antwort gesendet');
    }
  });

  const unreadCount = messages.filter(m => !m.is_read && m.direction === 'from_tenant').length;

  const groupedMessages = messages.reduce((acc, msg) => {
    if (!acc[msg.tenant_id]) {
      acc[msg.tenant_id] = [];
    }
    acc[msg.tenant_id].push(msg);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <MessageCircle className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Mieter-Nachrichten</h2>
            <p className="text-slate-600">Kommunikation mit Ihren Mietern</p>
          </div>
        </div>
        {unreadCount > 0 && (
          <Badge className="bg-red-500">{unreadCount} ungelesen</Badge>
        )}
      </div>

      {Object.entries(groupedMessages).map(([tenantId, tenantMessages]) => {
        const lastMessage = tenantMessages[0];
        const unread = tenantMessages.filter(m => !m.is_read && m.direction === 'from_tenant').length;

        return (
          <Card key={tenantId}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-slate-600" />
                  <CardTitle className="text-base">{lastMessage.sender_name}</CardTitle>
                  {unread > 0 && <Badge className="bg-blue-500">{unread} neu</Badge>}
                </div>
                <Button 
                  onClick={() => setReplyTo(lastMessage)}
                  size="sm"
                  variant="outline"
                >
                  <Reply className="w-4 h-4 mr-1" />
                  Antworten
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {tenantMessages.slice(0, 3).map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded-lg ${
                      msg.direction === 'from_tenant'
                        ? 'bg-slate-50 border border-slate-200'
                        : 'bg-blue-50 border border-blue-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-slate-600">
                        {new Date(msg.created_date).toLocaleString('de-DE')}
                      </span>
                      <Badge variant="outline">
                        {msg.direction === 'from_tenant' ? 'Von Mieter' : 'Von Ihnen'}
                      </Badge>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </div>

              {replyTo?.tenant_id === tenantId && (
                <div className="mt-4 p-4 bg-blue-50 rounded-lg space-y-3">
                  <label className="text-sm font-semibold">Antwort schreiben</label>
                  <Textarea
                    value={replyMessage}
                    onChange={(e) => setReplyMessage(e.target.value)}
                    placeholder="Ihre Nachricht..."
                    rows={4}
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => replyMutation.mutate()}
                      disabled={!replyMessage || replyMutation.isPending}
                      size="sm"
                    >
                      <Send className="w-4 h-4 mr-1" />
                      Senden
                    </Button>
                    <Button 
                      onClick={() => {
                        setReplyTo(null);
                        setReplyMessage('');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Abbrechen
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {messages.length === 0 && !isLoading && (
        <Card>
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">Noch keine Nachrichten von Mietern</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}