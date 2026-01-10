import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { MessageCircle, Send, Zap } from 'lucide-react';

export default function WorkflowAIAssistant({ companyId, isOpen, onOpenChange }) {
  const [messages, setMessages] = useState([
    {
      id: 1,
      role: 'assistant',
      content: 'Hallo! Ich bin dein Workflow-Assistent. Ich kann dir helfen, deine Workflows zu überwachen, zu optimieren und bei Fragen zu unterstützen.'
    }
  ]);
  const [userInput, setUserInput] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => base44.auth.me()
  });

  const chatMutation = useMutation({
    mutationFn: async (query) => {
      const res = await base44.functions.invoke('workflowAIAssistant', {
        company_id: companyId,
        user_query: query,
        action_type: 'chat'
      });
      return res.data?.response || 'Keine Antwort erhalten';
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: response
      }]);
    }
  });

  const quickActionMutation = useMutation({
    mutationFn: async (actionType) => {
      const res = await base44.functions.invoke('workflowAIAssistant', {
        company_id: companyId,
        action_type: actionType
      });
      return res.data?.response || 'Keine Antwort erhalten';
    },
    onSuccess: (response) => {
      setMessages(prev => [...prev, {
        id: prev.length + 1,
        role: 'assistant',
        content: response
      }]);
    }
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!userInput.trim()) return;

    const newMessage = {
      id: messages.length + 1,
      role: 'user',
      content: userInput
    };

    setMessages(prev => [...prev, newMessage]);
    chatMutation.mutate(userInput);
    setUserInput('');
  };

  const quickActions = [
    { label: 'Status anzeigen', action: 'status' },
    { label: 'Optimierungen anzeigen', action: 'optimization' },
    { label: 'Pausierungsempfehlungen', action: 'pause_recommendation' }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl h-96 flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5" />
            Workflow-KI-Assistent
          </DialogTitle>
          <DialogDescription>
            Frag mich alles über deine Workflows
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs p-3 rounded-lg ${
                  msg.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-900'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
              </div>
            </div>
          ))}
          {(chatMutation.isPending || quickActionMutation.isPending) && (
            <div className="flex justify-start">
              <div className="bg-slate-100 text-slate-900 p-3 rounded-lg">
                <p className="text-sm">Denkt nach...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        {messages.length <= 1 && (
          <div className="space-y-2 mb-4">
            <p className="text-xs font-medium text-slate-700">Schnellaktionen:</p>
            <div className="flex flex-wrap gap-2">
              {quickActions.map(action => (
                <Button
                  key={action.action}
                  size="sm"
                  variant="outline"
                  onClick={() => quickActionMutation.mutate(action.action)}
                  disabled={quickActionMutation.isPending}
                  className="text-xs gap-1"
                >
                  <Zap className="w-3 h-3" />
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Input */}
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            placeholder="Stelle eine Frage..."
            value={userInput}
            onChange={(e) => setUserInput(e.target.value)}
            disabled={chatMutation.isPending || quickActionMutation.isPending}
            className="text-sm"
          />
          <Button
            type="submit"
            disabled={!userInput.trim() || chatMutation.isPending || quickActionMutation.isPending}
            size="icon"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}