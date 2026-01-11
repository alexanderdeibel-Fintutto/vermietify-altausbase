import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bot, User, CheckCircle } from 'lucide-react';

export default function TenantAIChatbot({ tenantId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Ihr KI-Assistent. Ich kann Ihnen bei Fragen zu Wartung, Mietvertrag, Zahlungen, Hausordnung und mehr helfen. Wie kann ich Ihnen heute helfen?'
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage) => {
      const response = await base44.functions.invoke('tenantAIChatbot', {
        message: userMessage,
        conversation_history: messages,
        tenant_id: tenantId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        action: data.action,
        task_created: data.task_created
      }]);
      setInput('');
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    chatMutation.mutate(input);
  };

  const quickActions = [
    'Wie erstelle ich eine Wartungsanfrage?',
    'Wann ist die Miete fällig?',
    'Was sind die Ruhezeiten?',
    'Wo finde ich meinen Mietvertrag?',
    'Gibt es Gemeinschaftsräume?'
  ];

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="w-5 h-5 text-purple-600" />
          KI-Assistent
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-900'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                {msg.task_created && (
                  <Badge className="mt-2 bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Wartungsanfrage erstellt
                  </Badge>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-600 animate-pulse" />
              </div>
              <div className="bg-slate-100 rounded-2xl px-4 py-2">
                <p className="text-sm text-slate-600">Denke nach...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="p-4 border-t bg-slate-50">
            <p className="text-xs text-slate-600 mb-2 font-medium">Schnellaktionen:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInput(action);
                  }}
                  className="text-xs"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Schreiben Sie Ihre Frage..."
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || chatMutation.isPending}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}