import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Sparkles, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { ScrollArea } from "@/components/ui/scroll-area";

export default function AITaxAdvisorChat() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Ihr KI-Steuerberater. Ich kann Ihnen bei Fragen zu ELSTER-Einreichungen, Steueroptimierung und Compliance helfen. Wie kann ich Ihnen weiterhelfen?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein KI-Steuerberater-Assistent für ELSTER-Einreichungen.

Konversations-Historie:
${messages.map(m => `${m.role}: ${m.content}`).join('\n')}

User: ${userMessage}

Beantworte die Frage professionell, präzise und mit Fokus auf:
- ELSTER-spezifische Fragen
- Steuerliche Optimierung
- Compliance und GoBD
- Praktische Handlungsempfehlungen
- Fristen und Deadlines

Antworte auf Deutsch, klar und verständlich.`
      });

      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: response 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: 'Entschuldigung, es gab einen Fehler bei der Verarbeitung Ihrer Anfrage.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-purple-600" />
          KI-Steuerberater
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4 p-4">
        <ScrollArea className="flex-1 pr-4">
          <div className="space-y-4">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] p-3 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-slate-100 text-slate-900'
                }`}>
                  <div className="text-sm whitespace-pre-wrap">{msg.content}</div>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-slate-100 p-3 rounded-lg">
                  <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Frage zum Steuerrecht, ELSTER oder Formularen..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-slate-100"
            onClick={() => setInput('Wie optimiere ich meine Anlage V?')}
          >
            Anlage V Optimierung
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-slate-100"
            onClick={() => setInput('Welche Fristen sind wichtig?')}
          >
            Fristen
          </Badge>
          <Badge 
            variant="outline" 
            className="cursor-pointer hover:bg-slate-100"
            onClick={() => setInput('Was ist bei Sanierungen zu beachten?')}
          >
            Sanierungen
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}