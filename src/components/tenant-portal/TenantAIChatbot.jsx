import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bot, Send, Sparkles, AlertCircle, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantAIChatbot({ tenantId, onClose }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Ihr KI-Assistent. Ich kann Ihnen helfen bei:\n\n• Fragen zur Miete und zum Mietvertrag\n• Störungsmeldungen erstellen\n• Status von Wartungsarbeiten abfragen\n• Allgemeine Fragen beantworten\n\nWie kann ich Ihnen helfen?',
      timestamp: new Date()
    }
  ]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef(null);

  const chatMutation = useMutation({
    mutationFn: async (message) => {
      const response = await base44.functions.invoke('tenantAIChatbot', {
        tenant_id: tenantId,
        message
      });
      return response.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        action: data.action,
        issueCreated: data.issue_created,
        confidence: data.confidence,
        suggestedArticles: data.suggested_kb_articles,
        timestamp: new Date()
      }]);

      if (data.issue_created) {
        toast.success('Störungsmeldung wurde automatisch erstellt!');
      }
    },
    onError: () => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler. Bitte versuchen Sie es erneut.',
        timestamp: new Date()
      }]);
      toast.error('Fehler bei der Verarbeitung');
    }
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!inputMessage.trim()) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    chatMutation.mutate(inputMessage);
    setInputMessage('');
  };

  const quickActions = [
    { label: 'Mietvertrag-Fragen', prompt: 'Ich habe eine Frage zu meinem Mietvertrag' },
    { label: 'Störung melden', prompt: 'Ich möchte eine Störung melden' },
    { label: 'Wartungsstatus', prompt: 'Gibt es aktuelle Wartungsarbeiten?' },
    { label: 'Heizung Problem', prompt: 'Die Heizung funktioniert nicht richtig' }
  ];

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="border-b bg-gradient-to-r from-blue-600 to-blue-700">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Bot className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-white">KI-Assistent</CardTitle>
              <p className="text-xs text-blue-100">Immer für Sie da</p>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="text-white hover:bg-blue-800">
              ✕
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-3 ${
              msg.role === 'user'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-900'
            }`}>
              {msg.role === 'assistant' && (
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-semibold text-slate-600">KI-Assistent</span>
                </div>
              )}
              
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>

              {msg.action === 'create_issue' && msg.issueCreated && (
                <div className="mt-3 p-2 bg-green-100 border border-green-300 rounded-lg">
                  <div className="flex items-center gap-2 text-green-800">
                    <CheckCircle className="w-4 h-4" />
                    <span className="text-xs font-semibold">Störungsmeldung erstellt</span>
                  </div>
                  <p className="text-xs text-green-700 mt-1">{msg.issueCreated.title}</p>
                </div>
              )}

              {msg.suggestedArticles?.length > 0 && (
                <div className="mt-2 text-xs opacity-70">
                  📚 Basierend auf Wissensdatenbank
                </div>
              )}

              <div className="text-xs opacity-60 mt-2">
                {msg.timestamp.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          </div>
        ))}

        {chatMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 rounded-2xl px-4 py-3">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span className="text-sm text-slate-600">Denke nach...</span>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </CardContent>

      {messages.length === 1 && (
        <CardContent className="border-t p-3">
          <p className="text-xs text-slate-600 mb-2">Schnellaktionen:</p>
          <div className="grid grid-cols-2 gap-2">
            {quickActions.map((action, idx) => (
              <Button
                key={idx}
                variant="outline"
                size="sm"
                onClick={() => {
                  setInputMessage(action.prompt);
                }}
                className="text-xs justify-start h-auto py-2 whitespace-normal"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </CardContent>
      )}

      <CardContent className="border-t p-4">
        <div className="flex gap-2">
          <Input
            placeholder="Ihre Frage eingeben..."
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !chatMutation.isPending) {
                handleSend();
              }
            }}
            disabled={chatMutation.isPending}
          />
          <Button
            onClick={handleSend}
            disabled={!inputMessage.trim() || chatMutation.isPending}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}