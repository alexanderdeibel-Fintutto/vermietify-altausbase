import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send } from 'lucide-react';

export default function TeamChat() {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['teamChat'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getTeamMessages', {});
      return response.data.messages;
    },
    refetchInterval: 5000
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('sendTeamMessage', { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['teamChat'] });
      setMessage('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Team-Chat
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-64 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded">
          {messages.map((msg, idx) => (
            <div key={idx} className="p-2 bg-white rounded shadow-sm">
              <p className="text-xs font-semibold text-slate-700">{msg.user_name}</p>
              <p className="text-sm">{msg.text}</p>
              <p className="text-xs text-slate-500">{new Date(msg.timestamp).toLocaleTimeString('de-DE')}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Nachricht..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMutation.mutate()}
          />
          <Button size="icon" onClick={() => sendMutation.mutate()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}