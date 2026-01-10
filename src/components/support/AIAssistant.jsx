import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, Send } from 'lucide-react';

export default function AIAssistant() {
  const [message, setMessage] = useState('');
  const [conversation, setConversation] = useState([]);

  const chatMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein Hilfe-Assistent für eine Immobilienverwaltungs-Software. Beantworte diese Frage: ${message}`,
      });
      return response;
    },
    onSuccess: (response) => {
      setConversation([...conversation, 
        { role: 'user', content: message },
        { role: 'assistant', content: response }
      ]);
      setMessage('');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          KI-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="h-64 overflow-y-auto space-y-2 p-2 bg-slate-50 rounded">
          {conversation.map((msg, idx) => (
            <div key={idx} className={`p-2 rounded ${msg.role === 'user' ? 'bg-blue-50 ml-8' : 'bg-white mr-8'}`}>
              <p className="text-sm">{msg.content}</p>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <Input 
            placeholder="Frage stellen..." 
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && chatMutation.mutate()}
          />
          <Button size="icon" onClick={() => chatMutation.mutate()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}