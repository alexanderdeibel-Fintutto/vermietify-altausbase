import React, { useState, useRef, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Send, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';

export default function AITaxAdvisorChat({ taxYear, country }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const { data: profile } = useQuery({
    queryKey: ['taxProfile'],
    queryFn: async () => {
      const items = await base44.entities.TaxProfile.list();
      return items[0];
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (!input.trim()) return;

    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `Du bist ein erfahrener Steuerberater für komplexe Steuersituationen (${country}, ${taxYear}).

BENUTZER-PROFIL:
- Komplexität: ${profile?.profile_type}
- Länder: ${profile?.tax_jurisdictions?.join(', ')}
- Assets: Crypto, Business Entities, Real Estate

BENUTZER-FRAGE: ${userMsg}

BEANTWORTE:
1. Direkt & hilfreich
2. Unter Berücksichtigung ihrer Steuersituation
3. Mit praktischen, umsetzbaren Tipps
4. In derselben Sprache wie die Frage
5. Kurz & prägnant (max 3-4 Sätze)

Wenn es um Optimization geht, erwähne "💡 Sparpotenzial" wenn relevant.`
      });

      setMessages(prev => [...prev, { 
        role: 'advisor', 
        content: response 
      }]);
    } catch (error) {
      setMessages(prev => [...prev, { 
        role: 'error', 
        content: 'Fehler bei der Antwort. Bitte versuchen Sie es später erneut.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="flex flex-col h-[500px] bg-white">
      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="h-full flex items-center justify-center text-center">
            <div className="text-slate-500 font-light">
              <p className="text-sm">Hallo! 👋</p>
              <p className="text-xs mt-2">Stellen Sie Fragen zu Ihrer Steuersituation</p>
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-xs px-4 py-2 rounded-lg text-xs font-light ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white' 
                  : msg.role === 'error'
                  ? 'bg-red-50 text-red-800 border border-red-200'
                  : 'bg-slate-100 text-slate-900'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-100 px-4 py-2 rounded-lg">
              <Loader2 className="w-4 h-4 animate-spin text-slate-600" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-slate-200 p-3">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ihre Frage..."
            className="text-sm font-light"
            disabled={loading}
          />
          <Button
            size="icon"
            onClick={handleSendMessage}
            disabled={loading || !input.trim()}
            className="bg-slate-800 hover:bg-slate-900"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}