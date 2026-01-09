import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, Send, Loader2 } from 'lucide-react';

export default function TenantAIChatbot({ tenantId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hallo! Ich bin Ihr virtueller Assistent. Wie kann ich Ihnen heute helfen?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const chatMutation = useMutation({
    mutationFn: async (message) => {
      const response = await base44.functions.invoke('tenantAIChatbot', {
        message,
        tenant_id: tenantId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    
    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    chatMutation.mutate(userMessage);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader className="border-b border-slate-200">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="w-5 h-5 text-blue-600" />
          AI-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg p-3 ${
              msg.role === 'user' 
                ? 'bg-blue-600 text-white' 
                : 'bg-slate-100 text-slate-900'
            }`}>
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
            </div>
          </div>
        ))}
        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-lg p-3">
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </CardContent>
      <div className="p-4 border-t border-slate-200">
        <div className="flex gap-2">
          <Input
            placeholder="Stellen Sie eine Frage..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          />
          <Button 
            onClick={handleSend} 
            disabled={chatMutation.isPending || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}