import React, { useState, useRef, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Send, MessageCircle, AlertCircle, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxStrategyAdvisor() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const { mutate: askAdvisor, isLoading } = base44.functions.useMutation('generateTaxStrategyAdvice');

  const handleAsk = async () => {
    if (!question.trim()) return;

    setMessages(prev => [...prev, { role: 'user', content: question }]);
    setQuestion('');

    try {
      const response = await base44.functions.invoke('generateTaxStrategyAdvice', {
        country,
        taxYear,
        question
      });

      const advice = response.data?.advice;
      setMessages(prev => [...prev, {
        role: 'advisor',
        content: advice?.content?.answer || 'Keine Antwort erhalten',
        details: advice?.content
      }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'advisor',
        content: 'Fehler bei der Verarbeitung. Bitte versuchen Sie es später erneut.',
        error: true
      }]);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="space-y-6 h-screen flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💬 Steuer-Strategie Berater</h1>
        <p className="text-slate-500 mt-1">KI-gestützter Dialog zu Steuerfragen</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
              <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
              <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR, CURRENT_YEAR + 1].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Chat Area */}
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <MessageCircle className="w-4 h-4" />
            Konversation
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Stellen Sie eine Frage zum Steuern, und der Berater wird helfen</p>
            </div>
          ) : (
            messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-md p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : msg.error
                    ? 'bg-red-50 border border-red-200'
                    : 'bg-slate-100'
                }`}>
                  <p className="text-sm">{msg.content}</p>
                  
                  {msg.details && (
                    <div className="mt-3 space-y-2 text-xs">
                      {msg.details.explanation && (
                        <div>
                          <p className="font-medium mb-1">Erklärung:</p>
                          <p className="opacity-90">{msg.details.explanation}</p>
                        </div>
                      )}
                      
                      {(msg.details.implementation_steps || []).length > 0 && (
                        <div>
                          <p className="font-medium mb-1">Umsetzungsschritte:</p>
                          <ul className="list-disc list-inside space-y-1">
                            {msg.details.implementation_steps.map((step, j) => (
                              <li key={j}>{step}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {(msg.details.compliance_notes || []).length > 0 && (
                        <div className="bg-yellow-50 p-2 rounded mt-2">
                          <p className="font-medium text-yellow-900 mb-1">⚠️ Compliance:</p>
                          {msg.details.compliance_notes.map((note, j) => (
                            <p key={j} className="text-yellow-800">• {note}</p>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </CardContent>
      </Card>

      {/* Input Area */}
      <div className="flex gap-2">
        <Input
          placeholder="Stellen Sie eine Frage zu Steuern..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
          disabled={isLoading}
        />
        <Button
          onClick={handleAsk}
          disabled={isLoading || !question.trim()}
          className="bg-blue-600 hover:bg-blue-700"
        >
          <Send className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}