import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Send, Loader2, CheckCheck, Bot, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

export default function TenantMessagingInterface({ tenantId, tenantEmail }) {
  const [messageText, setMessageText] = useState('');
  const [showAISummary, setShowAISummary] = useState(false);
  const [aiSummary, setAiSummary] = useState(null);
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ['tenantMessages', tenantId],
    queryFn: () => base44.entities.TenantMessage.filter({ tenant_id: tenantId }, '-created_at', 100),
    refetchInterval: 3000
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (text) => {
      return await base44.functions.invoke('sendTenantMessage', {
        tenant_id: tenantId,
        sender_email: tenantEmail,
        sender_type: 'tenant',
        message_text: text
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantMessages', tenantId] });
      setMessageText('');
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId) => 
      base44.entities.TenantMessage.update(messageId, { is_read: true, read_at: new Date().toISOString() }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantMessages', tenantId] });
    }
  });

  const generateSummaryMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('generateThreadSummary', {
        tenant_id: tenantId
      });
      return result.data;
    },
    onSuccess: (data) => {
      setAiSummary(data.summary);
      setShowAISummary(true);
    }
  });

  const createTicketMutation = useMutation({
    mutationFn: async (messageId) => {
      const message = messages.find(m => m.id === messageId);
      return await base44.functions.invoke('createTicketFromMessage', {
        message_id: messageId,
        tenant_id: tenantId,
        tenant_email: tenantEmail,
        message_text: message.message_text,
        source: 'message'
      });
    },
    onSuccess: (response) => {
      toast.success(`Ticket ${response.data.ticket_number} erstellt`);
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    
    // Mark unread messages as read
    messages.forEach(msg => {
      if (!msg.is_read && msg.sender_type !== 'tenant') {
        markAsReadMutation.mutate(msg.id);
      }
    });
  }, [messages]);

  const handleSend = () => {
    if (!messageText.trim()) return;
    sendMessageMutation.mutate(messageText);
  };

  const unreadCount = messages.filter(m => !m.is_read && m.sender_type !== 'tenant').length;

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            Nachrichten
            {unreadCount > 0 && (
              <Badge className="bg-blue-600">{unreadCount} neu</Badge>
            )}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => generateSummaryMutation.mutate()}
            disabled={generateSummaryMutation.isPending || messages.length < 5}
            className="gap-2"
          >
            <Bot className="w-4 h-4" />
            AI Zusammenfassung
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* AI Summary */}
        {showAISummary && aiSummary && (
          <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Bot className="w-5 h-5 text-purple-600" />
              <p className="font-semibold text-purple-900">AI Zusammenfassung</p>
            </div>
            <p className="text-sm text-purple-800">{aiSummary}</p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowAISummary(false)}
              className="mt-2 text-xs"
            >
              Ausblenden
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-slate-600" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex justify-center items-center h-full text-slate-500 text-sm">
            Noch keine Nachrichten
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`group flex ${msg.sender_type === 'tenant' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[70%] rounded-lg p-3 ${
                  msg.sender_type === 'tenant'
                    ? 'bg-slate-700 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="text-sm">{msg.message_text}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs opacity-75">
                    {new Date(msg.created_at).toLocaleTimeString('de-DE', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </span>
                  {msg.sender_type === 'tenant' && (
                    <CheckCheck
                      className={`w-4 h-4 ${msg.is_read ? 'text-blue-400' : 'opacity-50'}`}
                    />
                  )}
                  {msg.sender_type === 'tenant' && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        createTicketMutation.mutate(msg.id);
                      }}
                      className="h-5 px-2 py-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Ticket className="w-3 h-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </CardContent>

      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <Textarea
            placeholder="Nachricht eingeben..."
            value={messageText}
            onChange={(e) => setMessageText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            className="min-h-[60px] max-h-[120px]"
          />
          <Button
            onClick={handleSend}
            disabled={!messageText.trim() || sendMessageMutation.isPending}
            className="bg-slate-700 hover:bg-slate-800"
          >
            {sendMessageMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
}