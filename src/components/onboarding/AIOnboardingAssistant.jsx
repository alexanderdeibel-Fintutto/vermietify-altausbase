import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Bot, Send, User, Sparkles, Calendar, CheckCircle2, Home } from 'lucide-react';

export default function AIOnboardingAssistant({ tenantId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: '👋 Willkommen! Ich bin Ihr persönlicher Einzugs-Assistent und helfe Ihnen bei allen Fragen rund um Ihren Umzug.\n\n📋 Ich kann Ihnen helfen bei:\n• Schritt-für-Schritt Anleitung zur Checkliste\n• Fragen zur Wohnung und zum Gebäude\n• Infos zu lokalen Geschäften und Verkehrsmitteln\n• Einrichtung digitaler Schlüssel\n• Terminvereinbarungen für Wohnungsübergaben\n\nWie kann ich Ihnen heute helfen?'
    }
  ]);
  const [input, setInput] = useState('');

  const { data: onboardingSession } = useQuery({
    queryKey: ['onboarding-session', tenantId],
    queryFn: async () => {
      const sessions = await base44.entities.TenantAppSession.filter({ tenant_id: tenantId });
      return sessions[0];
    }
  });

  const chatMutation = useMutation({
    mutationFn: (question) =>
      base44.functions.invoke('aiOnboardingAssistant', {
        tenant_id: tenantId,
        question,
        conversation_history: messages.slice(-6)
      }),
    onSuccess: (response) => {
      const newMessages = [
        ...messages,
        { role: 'user', content: input },
        { role: 'assistant', content: response.data.answer, schedule_request: response.data.schedule_request }
      ];
      setMessages(newMessages);
      setInput('');
    }
  });

  const quickActions = [
    { icon: CheckCircle2, text: 'Wie geht die Checkliste?', question: 'Erkläre mir die Schritte der Einzugs-Checkliste' },
    { icon: Home, text: 'Infos zur Wohnung', question: 'Erzähl mir mehr über meine Wohnung und das Gebäude' },
    { icon: Calendar, text: 'Termin vereinbaren', question: 'Ich möchte einen Termin für die Wohnungsübergabe vereinbaren' },
    { icon: Sparkles, text: 'Lokale Tipps', question: 'Welche Geschäfte, Restaurants und ÖPNV gibt es in der Nähe?' }
  ];

  const getProgressPercentage = () => {
    if (!onboardingSession?.onboarding_progress) return 0;
    const progress = onboardingSession.onboarding_progress;
    const completed = Object.values(progress).filter(v => v === true).length;
    return Math.round((completed / 5) * 100);
  };

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-t-lg">
        <CardTitle className="text-base flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5" />
            Einzugs-Assistent
          </div>
          <Badge className="bg-white/20 text-white">
            {getProgressPercentage()}% erledigt
          </Badge>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <div className={`max-w-[85%] p-3 rounded-lg ${
                msg.role === 'user' 
                  ? 'bg-slate-800 text-white' 
                  : 'bg-slate-100 text-slate-900'
              }`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                {msg.schedule_request && (
                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded">
                    <p className="text-xs font-medium text-blue-900 mb-1">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      Termin-Anfrage erkannt
                    </p>
                    <p className="text-xs text-blue-700">
                      Typ: {msg.schedule_request.appointment_type}
                    </p>
                    <Button size="sm" className="mt-2 w-full" variant="outline">
                      Termin jetzt buchen
                    </Button>
                  </div>
                )}
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
          <div className="px-4 pb-2">
            <p className="text-xs text-slate-600 mb-2 font-medium">Schnellstart:</p>
            <div className="grid grid-cols-2 gap-2">
              {quickActions.map((action, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInput(action.question);
                    chatMutation.mutate(action.question);
                  }}
                  className="text-xs h-auto py-2 flex items-start gap-2 text-left"
                >
                  <action.icon className="w-3 h-3 flex-shrink-0 mt-0.5" />
                  <span>{action.text}</span>
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="border-t p-4">
          <div className="flex gap-2">
            <Textarea
              placeholder="Ihre Frage zum Einzug..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  if (input.trim()) chatMutation.mutate(input);
                }
              }}
              rows={2}
              className="flex-1 resize-none"
            />
            <Button
              onClick={() => chatMutation.mutate(input)}
              disabled={!input.trim() || chatMutation.isPending}
              className="px-4"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}