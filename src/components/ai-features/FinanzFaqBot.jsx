import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Send, RefreshCw, HelpCircle } from 'lucide-react';
import { toast } from 'sonner';

const BEISPIEL_FRAGEN = [
  'Was ist die Kleinreparaturklausel?',
  'Wie berechne ich die Bruttomietrendite?',
  'Welche Kosten sind in der Anlage V absetzbar?',
  'Was ist SKR03?',
  'Wie hoch darf die Kaution sein?'
];

export default function FinanzFaqBot() {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '💬 Hallo! Ich bin dein Finanz-Assistent. Stell mir Fragen zu Mietrecht, Steuern, Nebenkosten oder Finanzen. Wie kann ich dir heute helfen?'
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationHistory, setConversationHistory] = useState([
    {
      role: 'assistant',
      content: '💬 Hallo! Ich bin dein Finanz-Assistent. Stell mir Fragen zu Mietrecht, Steuern, Nebenkosten oder Finanzen. Wie kann ich dir heute helfen?'
    }
  ]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (text = input) => {
    if (!text.trim()) return;

    const userMessage = { role: 'user', content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await base44.functions.invoke('fragFinanzBot', {
        messages: [userMessage],
        conversationHistory
      });

      if (response.data) {
        const assistantMessage = { role: 'assistant', content: response.data.antwort };
        setMessages(prev => [...prev, assistantMessage]);
        setConversationHistory(response.data.updatedHistory);
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  };

  const resetChat = () => {
    setMessages([
      {
        role: 'assistant',
        content: '💬 Hallo! Ich bin dein Finanz-Assistent. Stell mir Fragen zu Mietrecht, Steuern, Nebenkosten oder Finanzen. Wie kann ich dir heute helfen?'
      }
    ]);
    setConversationHistory([
      {
        role: 'assistant',
        content: '💬 Hallo! Ich bin dein Finanz-Assistent. Stell mir Fragen zu Mietrecht, Steuern, Nebenkosten oder Finanzen. Wie kann ich dir heute helfen?'
      }
    ]);
    setInput('');
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <Card className="flex flex-col h-96">
        <CardHeader className="border-b flex-shrink-0">
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <HelpCircle className="w-5 h-5" />
              Finanz-FAQ
            </CardTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetChat}
              className="gap-1"
            >
              <RefreshCw className="w-4 h-4" />
              Reset
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, idx) => (
            <div
              key={idx}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-900 px-4 py-2 rounded-lg">
                <Loader2 className="w-4 h-4 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {messages.length === 1 && (
        <div>
          <div className="text-xs font-medium text-gray-500 mb-2">Beispielfragen:</div>
          <div className="flex flex-wrap gap-2">
            {BEISPIEL_FRAGEN.map((frage, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => sendMessage(frage)}
                disabled={loading}
                className="text-xs justify-start"
              >
                {frage}
              </Button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && !loading && sendMessage()}
          placeholder="Deine Frage..."
          disabled={loading}
          className="flex-1"
        />
        <Button
          onClick={() => sendMessage()}
          disabled={loading || !input.trim()}
          className="gap-1"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </Button>
      </div>
    </div>
  );
}