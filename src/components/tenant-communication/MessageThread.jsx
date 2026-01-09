import React, { useState, useMemo } from 'react';
import { base44 } from '@/api/base44Client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Send, Loader2 } from 'lucide-react';

const typeIcons = {
  message: '💬',
  inquiry: '❓',
  complaint: '⚠️',
  maintenance_request: '🔧'
};

const priorityColors = {
  low: 'bg-blue-100 text-blue-700',
  normal: 'bg-slate-100 text-slate-700',
  high: 'bg-orange-100 text-orange-700'
};

const statusColors = {
  open: 'bg-yellow-100 text-yellow-700',
  in_progress: 'bg-blue-100 text-blue-700',
  resolved: 'bg-green-100 text-green-700',
  closed: 'bg-slate-100 text-slate-700'
};

export default function MessageThread({ conversationId, tenantId, unitId, buildingId, onClose }) {
  const [reply, setReply] = useState('');
  const [messageType, setMessageType] = useState('message');
  const queryClient = useQueryClient();

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: messages = [] } = useQuery({
    queryKey: ['threadMessages', conversationId],
    queryFn: () => base44.entities.TenantMessage.filter(
      { conversation_id: conversationId },
      'created_date',
      100
    ),
  });

  const { data: tenant } = useQuery({
    queryKey: ['tenant', tenantId],
    queryFn: () => base44.entities.Tenant.filter({ id: tenantId }, null, 1),
  });

  const sendMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('sendTenantMessage', data),
    onSuccess: () => {
      setReply('');
      queryClient.invalidateQueries({ queryKey: ['threadMessages'] });
    },
  });

  const markAsReadMutation = useMutation({
    mutationFn: (messageId) => 
      base44.entities.TenantMessage.update(messageId, {
        is_read: true,
        read_at: new Date().toISOString()
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['threadMessages'] });
    },
  });

  const handleSendReply = () => {
    if (!reply.trim()) return;

    sendMutation.mutate({
      conversationId,
      tenantId,
      unitId,
      buildingId,
      content: reply,
      messageType,
      priority: 'normal'
    });
  };

  // Mark new messages as read when viewing
  React.useEffect(() => {
    messages.forEach(msg => {
      if (!msg.is_read && msg.sender_type !== currentUser?.role) {
        markAsReadMutation.mutate(msg.id);
      }
    });
  }, [messages, currentUser]);

  return (
    <div className="flex flex-col h-full max-h-[600px]">
      {/* Header */}
      <div className="border-b border-slate-200 p-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="font-light text-slate-900">{tenant?.[0]?.full_name}</h2>
            <p className="text-xs font-light text-slate-600">{tenant?.[0]?.email}</p>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose}>✕</Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-slate-600 font-light">Keine Nachrichten in diesem Thread</p>
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`p-3 rounded-lg ${
                msg.sender_type === 'admin'
                  ? 'bg-blue-50 ml-8 border-l-4 border-blue-300'
                  : 'bg-slate-100 mr-8 border-l-4 border-slate-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-light text-slate-600">
                    {msg.sender_name} ({msg.sender_type === 'admin' ? 'Verwaltung' : 'Mieter'})
                  </p>
                  <p className="text-xs font-light text-slate-500 mt-0.5">
                    {format(new Date(msg.created_date), 'd. MMM yyyy HH:mm', { locale: de })}
                  </p>
                </div>
                <div className="flex gap-1">
                  {msg.message_type !== 'message' && (
                    <Badge className="text-xs">{typeIcons[msg.message_type]} {msg.message_type}</Badge>
                  )}
                  {msg.priority !== 'normal' && (
                    <Badge className={priorityColors[msg.priority]}>{msg.priority}</Badge>
                  )}
                </div>
              </div>
              {msg.subject && <p className="font-light text-sm text-slate-900 mt-2 font-semibold">{msg.subject}</p>}
              <p className="font-light text-slate-700 mt-2 text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          ))
        )}
      </div>

      {/* Reply Input */}
      <div className="border-t border-slate-200 p-4 space-y-3">
        <Textarea
          placeholder="Nachricht eingeben..."
          value={reply}
          onChange={(e) => setReply(e.target.value)}
          className="font-light h-20 resize-none"
        />
        <div className="flex gap-2 items-center">
          <select
            value={messageType}
            onChange={(e) => setMessageType(e.target.value)}
            className="text-xs font-light px-2 py-1 border border-slate-200 rounded"
          >
            <option value="message">💬 Nachricht</option>
            <option value="inquiry">❓ Anfrage</option>
            <option value="complaint">⚠️ Beschwerde</option>
            <option value="maintenance_request">🔧 Wartung</option>
          </select>
          <Button
            onClick={handleSendReply}
            disabled={!reply.trim() || sendMutation.isPending}
            className="ml-auto bg-blue-600 hover:bg-blue-700 font-light"
          >
            {sendMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}