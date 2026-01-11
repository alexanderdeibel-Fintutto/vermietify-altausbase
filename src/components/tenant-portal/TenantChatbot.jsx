import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Bot, Send, User } from 'lucide-react';

export default function TenantChatbot({ tenantId, companyId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Ihr digitaler Assistent. Ich kann Ihnen bei häufigen Fragen helfen, z.B.:\n\n• Wann ist die Miete fällig?\n• Wie melde ich eine Wartungsanfrage?\n• Wo finde ich meine Dokumente?\n• Wie kontaktiere ich die Verwaltung?\n\nWie kann ich Ihnen helfen?'
    }
  ]);
  const [input, setInput] = useState('');

  const chatMutation = useMutation({
    mutationFn: (question) =>
      base44.functions.invoke('tenantChatbotAssistant', {
        tenant_id: tenantId,
        company_id: companyId,
        question
      }),
    onSuccess: (response) => {
      setMessages([...messages, 
        { role: 'user', content: input },
        { role: 'assistant', content: response.data.answer }
      ]);
      setInput('');
    }
  });

  const quickQuestions = [
    'Wann ist die Miete fällig?',
    'Wie melde ich eine Reparatur?',
    'Wo finde ich meinen Mietvertrag?',
    'Wie erreiche ich die Verwaltung?'
  ];

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-t-lg">
        <CardTitle className="text-base flex items-center gap-2">
          <Bot className="w-5 h-5" />
          Mieter-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col p-0">
        <div className="flex-1 overflow-y-auto p-4 space-y-3 max-h-96">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-blue-600" />
                </div>
              )}
              <div className={`max-w-[80%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-slate-600" />
                </div>
              )}
            </div>
          ))}
        </div>

        {messages.length === 1 && (
          <div className="px-4 pb-4">
            <p className="text-xs text-slate-600 mb-2">Schnellfragen:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickQuestions.map((q, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInput(q);
                    chatMutation.mutate(q);
                  }}
                  className="text-xs h-auto py-2"
                >
                  {q}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ihre Frage..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) chatMutation.mutate(input);
                }
              }}
              rows={2}
              className="flex-1"
            />
            <Button
              onClick={() => chatMutation.mutate(input)}
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