import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, Send } from 'lucide-react';

export default function AIAssistant() {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const askMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein Steuer- und Vermögensberater. Beantworte diese Frage: ${question}`,
        add_context_from_internet: true
      });
      return response;
    },
    onSuccess: (data) => {
      setAnswer(data);
      setQuestion('');
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
        {answer && (
          <div className="p-3 bg-blue-50 rounded-lg mb-3">
            <p className="text-sm text-slate-700">{answer}</p>
          </div>
        )}
        <div className="flex gap-2">
          <Input
            placeholder="Stellen Sie Ihre Frage..."
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
          />
          <Button size="icon" onClick={() => askMutation.mutate()} disabled={!question}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}