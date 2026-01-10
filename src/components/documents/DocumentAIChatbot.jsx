import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageCircle, Send, FileText } from 'lucide-react';

export default function DocumentAIChatbot({ companyId }) {
  const [messages, setMessages] = useState([
    { id: 1, type: 'assistant', text: 'Hallo! Ich kann dir helfen, Dokumente zu finden und Fragen zu beantworten. Was möchtest du wissen?' }
  ]);
  const [input, setInput] = useState('');
  const messagesEnd = useRef(null);

  const chatMutation = useMutation({
    mutationFn: (query) =>
      base44.functions.invoke('documentAIChatbot', {
        company_id: companyId,
        query
      }),
    onSuccess: (result) => {
      setMessages(prev => [
        ...prev,
        {
          id: Math.random(),
          type: 'assistant',
          text: result.data.answer,
          references: result.data.references
        }
      ]);
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;

    setMessages(prev => [...prev, { id: Math.random(), type: 'user', text: input }]);
    chatMutation.mutate(input);
    setInput('');
  };

  useEffect(() => {
    messagesEnd.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <Card className="h-96 flex flex-col">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          Dokumenten-Assistant
        </CardTitle>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto space-y-3 pb-3">
        {messages.map(msg => (
          <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-xs rounded-lg px-3 py-2 ${
              msg.type === 'user'
                ? 'bg-blue-500 text-white'
                : 'bg-slate-100 text-slate-900'
            }`}>
              <p className="text-sm">{msg.text}</p>
              {msg.references && msg.references.length > 0 && (
                <div className="mt-2 space-y-1">
                  {msg.references.map(ref => (
                    <Badge key={ref.id} variant="outline" className="text-xs block">
                      <FileText className="w-2 h-2 mr-1" />
                      {ref.name}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={messagesEnd} />
      </CardContent>

      <div className="border-t p-3 flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Frage stellen..."
          className="flex-1 text-sm"
        />
        <Button
          size="sm"
          onClick={handleSend}
          disabled={chatMutation.isPending}
        >
          <Send className="w-3 h-3" />
        </Button>
      </div>
    </Card>
  );
}