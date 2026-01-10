import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MessageCircle, Send } from 'lucide-react';
import { toast } from 'sonner';

export default function InAppChatSupport() {
  const [message, setMessage] = useState('');
  const queryClient = useQueryClient();

  const { data: messages = [] } = useQuery({
    queryKey: ['supportMessages'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getSupportMessages', {});
      return response.data.messages;
    },
    refetchInterval: 5000
  });

  const sendMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('sendSupportMessage', { message });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['supportMessages'] });
      setMessage('');
      toast.success('Nachricht gesendet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          Live-Chat-Support
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-64 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded">
          {messages.map((msg, idx) => (
            <div key={idx} className={`p-2 rounded ${msg.from === 'user' ? 'bg-blue-100 ml-8' : 'bg-white mr-8'}`}>
              <p className="text-xs font-semibold">{msg.from === 'user' ? 'Sie' : 'Support'}</p>
              <p className="text-sm">{msg.text}</p>
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