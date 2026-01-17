import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Button } from '@/components/ui/button';
import TimeAgo from '@/components/shared/TimeAgo';
import { Send, MessageSquare } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function MessageThread({ messages = [], threadId, onSendMessage }) {
  const [newMessage, setNewMessage] = useState('');
  const queryClient = useQueryClient();

  const sendMutation = useMutation({
    mutationFn: async (message) => {
      await base44.entities.MessageThread.create({
        thread_id: threadId,
        message,
        sender_type: 'landlord'
      });
    },
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries(['messages', threadId]);
      if (onSendMessage) onSendMessage();
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Nachrichten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`p-3 rounded-lg ${
                msg.sender_type === 'landlord' 
                  ? 'bg-[var(--vf-primary-50)] ml-8' 
                  : 'bg-[var(--theme-surface)] mr-8'
              }`}
            >
              <div className="text-sm mb-1">{msg.message}</div>
              <TimeAgo date={msg.created_date} className="text-xs text-[var(--theme-text-muted)]" />
            </div>
          ))}
        </div>

        <div className="space-y-3">
          <VfTextarea
            placeholder="Nachricht schreiben..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
          />
          <Button 
            variant="gradient"
            onClick={() => sendMutation.mutate(newMessage)}
            disabled={!newMessage || sendMutation.isPending}
          >
            <Send className="h-4 w-4 mr-2" />
            Senden
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}