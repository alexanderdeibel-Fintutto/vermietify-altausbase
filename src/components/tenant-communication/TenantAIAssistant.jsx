import React, { useState, useRef, useEffect } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, Loader, MessageCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function TenantAIAssistant({ tenantId }) {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hallo! Ich bin der AI-Assistent. Wie kann ich dir heute helfen?' }
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const { data: tenantContext } = useQuery({
    queryKey: ['tenant-context', tenantId],
    queryFn: async () => {
      if (!tenantId) return null;
      const tenant = await base44.entities.Tenant.read(tenantId);
      const contracts = await base44.entities.LeaseContract.filter(
        { tenant_id: tenantId },
        '-created_date',
        1
      );
      const invoices = await base44.entities.Invoice.filter(
        { tenant_id: tenantId },
        '-due_date',
        5
      );
      return { tenant, activeContract: contracts[0], recentInvoices: invoices };
    },
    enabled: !!tenantId,
  });

  const assistantMutation = useMutation({
    mutationFn: async (userMessage) => {
      const response = await base44.functions.invoke('aiTenantAssistant', {
        message: userMessage,
        tenantContext,
        conversationHistory: messages,
      });
      return response.data;
    },
    onSuccess: (data) => {
      setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
    },
  });

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const userMessage = inputValue.trim();
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInputValue('');
    assistantMutation.mutate(userMessage);
  };

  return (
    <Card className="p-6 space-y-4 h-96 flex flex-col">
      <div>
        <h3 className="text-lg font-light text-slate-900 flex items-center gap-2">
          <MessageCircle className="w-5 h-5" />
          AI-Assistent
        </h3>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs px-4 py-2 rounded-lg ${
                msg.role === 'user'
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-900'
              }`}
            >
              <ReactMarkdown className="text-sm font-light prose prose-sm max-w-none">
                {msg.content}
              </ReactMarkdown>
            </div>
          </div>
        ))}
        {assistantMutation.isPending && (
          <div className="flex justify-start">
            <div className="bg-slate-100 text-slate-900 px-4 py-2 rounded-lg">
              <Loader className="w-4 h-4 animate-spin" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Stellen Sie eine Frage..."
          disabled={assistantMutation.isPending}
          className="font-light"
        />
        <Button
          type="submit"
          disabled={assistantMutation.isPending}
          className="bg-slate-900 hover:bg-slate-800"
        >
          <Send className="w-4 h-4" />
        </Button>
      </form>
    </Card>
  );
}