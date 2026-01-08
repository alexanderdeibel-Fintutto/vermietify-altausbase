import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function AIFormAssistant({ submissionId }) {
  const [question, setQuestion] = useState('');
  const [conversation, setConversation] = useState([]);
  const [asking, setAsking] = useState(false);

  const askQuestion = async () => {
    if (!question.trim()) return;

    const userMessage = { role: 'user', content: question };
    setConversation([...conversation, userMessage]);
    setQuestion('');
    setAsking(true);

    try {
      const response = await base44.functions.invoke('aiFormAssistant', {
        submission_id: submissionId,
        question
      });

      if (response.data.success) {
        setConversation(prev => [...prev, {
          role: 'assistant',
          content: response.data.answer,
          confidence: response.data.confidence,
          related_fields: response.data.related_fields
        }]);
      }
    } catch (error) {
      toast.error('Fehler beim Abrufen der Antwort');
      console.error(error);
    } finally {
      setAsking(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="w-5 h-5" />
          KI-Formular-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="h-64 overflow-y-auto space-y-3 p-3 bg-slate-50 rounded-lg">
          {conversation.length === 0 ? (
            <p className="text-sm text-slate-500 text-center py-8">
              Stellen Sie Fragen zu diesem Formular...
            </p>
          ) : (
            conversation.map((msg, idx) => (
              <div
                key={idx}
                className={`p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-100 ml-8' 
                    : 'bg-white mr-8'
                }`}
              >
                <div className="text-sm">{msg.content}</div>
                {msg.confidence && (
                  <Badge variant="outline" className="mt-2">
                    {msg.confidence}% Vertrauen
                  </Badge>
                )}
              </div>
            ))
          )}
        </div>

        <div className="flex gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && askQuestion()}
            placeholder="z.B. Welche Ausgaben kann ich absetzen?"
            disabled={asking}
          />
          <Button onClick={askQuestion} disabled={asking || !question.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}