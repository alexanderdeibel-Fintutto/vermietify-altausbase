import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Send, Bot, User, CheckCircle, Calendar, AlertCircle, Bell } from 'lucide-react';

export default function TenantAIChatbot({ tenantId }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Hallo! Ich bin Ihr KI-Assistent. Ich kann Ihnen bei Wartung, Terminbuchungen, Status-Updates und mehr helfen!'
    }
  ]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch proactive notifications
  const { data: notifications } = useQuery({
    queryKey: ['tenant-notifications'],
    queryFn: async () => {
      const response = await base44.functions.invoke('tenantAIChatbot', {
        check_notifications: true,
        tenant_id: tenantId
      });
      return response.data.notifications;
    },
    refetchInterval: 60000 // Check every minute
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(scrollToBottom, [messages]);

  const chatMutation = useMutation({
    mutationFn: async (userMessage) => {
      const response = await base44.functions.invoke('tenantAIChatbot', {
        message: userMessage,
        conversation_history: messages,
        tenant_id: tenantId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.response,
        action: data.action,
        task_created: data.task_created,
        appointment_booked: data.appointment_booked,
        status_info: data.status_info
      }]);
      setInput('');
    }
  });

  const handleSend = () => {
    if (!input.trim()) return;
    
    setMessages(prev => [...prev, { role: 'user', content: input }]);
    chatMutation.mutate(input);
  };

  const quickActions = [
    'Wartungsanfrage erstellen',
    'Termin buchen',
    'Status meiner Anfragen',
    'Wann ist die Miete fällig?',
    'Hausordnung'
  ];

  return (
    <Card className="flex flex-col h-[600px]">
      <CardHeader className="border-b">
        <CardTitle className="flex items-center gap-2 text-base">
          <Bot className="w-5 h-5 text-purple-600" />
          KI-Assistent
        </CardTitle>
      </CardHeader>
      
      <CardContent className="flex-1 overflow-hidden p-0 flex flex-col">
        {/* Proactive Notifications */}
        {notifications && (notifications.urgent_maintenance?.length > 0 || notifications.announcements?.length > 0) && (
          <div className="p-3 border-b bg-orange-50 space-y-2">
            {notifications.urgent_maintenance?.map((task, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <AlertCircle className="w-4 h-4 text-orange-600 mt-0.5" />
                <div>
                  <p className="font-medium text-orange-900">{task.title}</p>
                  <p className="text-xs text-orange-700">{task.description}</p>
                </div>
              </div>
            ))}
            {notifications.announcements?.map((ann, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Bell className="w-4 h-4 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">{ann.title}</p>
                  <p className="text-xs text-blue-700">{ann.message}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-4 h-4 text-purple-600" />
                </div>
              )}
              <div className={`max-w-[80%] ${msg.role === 'user' ? 'order-1' : ''}`}>
                <div className={`rounded-2xl px-4 py-2 ${
                  msg.role === 'user' 
                    ? 'bg-slate-800 text-white' 
                    : 'bg-slate-100 text-slate-900'
                }`}>
                  <p className="text-sm leading-relaxed">{msg.content}</p>
                </div>
                {msg.task_created && (
                  <Badge className="mt-2 bg-green-100 text-green-800">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Wartungsanfrage erstellt
                  </Badge>
                )}
                {msg.appointment_booked && (
                  <Badge className="mt-2 bg-blue-100 text-blue-800">
                    <Calendar className="w-3 h-3 mr-1" />
                    Termin gebucht
                  </Badge>
                )}
                {msg.status_info && (
                  <div className="mt-2 p-2 bg-slate-100 rounded text-xs">
                    <p><strong>Status:</strong> {msg.status_info.status}</p>
                    <p><strong>Voraussichtlich:</strong> {msg.status_info.estimated_completion}</p>
                  </div>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center flex-shrink-0">
                  <User className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
          ))}
          {chatMutation.isPending && (
            <div className="flex gap-3 justify-start">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <Bot className="w-4 h-4 text-purple-600 animate-pulse" />
              </div>
              <div className="bg-slate-100 rounded-2xl px-4 py-2">
                <p className="text-sm text-slate-600">Denke nach...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="p-4 border-t bg-slate-50">
            <p className="text-xs text-slate-600 mb-2 font-medium">Schnellaktionen:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map((action, i) => (
                <Button
                  key={i}
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    setInput(action);
                  }}
                  className="text-xs"
                >
                  {action}
                </Button>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 border-t">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Schreiben Sie Ihre Frage..."
              disabled={chatMutation.isPending}
            />
            <Button
              onClick={handleSend}
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