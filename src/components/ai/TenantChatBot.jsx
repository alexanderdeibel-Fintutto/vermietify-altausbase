import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Sparkles, Send, Loader2 } from 'lucide-react';

export default function TenantChatBot({ leaseId }) {
  const [messages, setMessages] = useState([
    { id: 1, role: 'assistant', content: 'Hallo! Ich bin dein KI-Assistent. Wie kann ich dir heute helfen?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = { id: Date.now(), role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await base44.functions.invoke('tenantAIChatbot', {
        message: input,
        conversationHistory: messages,
        leaseId
      });

      const assistantMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: response.data.message
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: 'Entschuldigung, es gab einen Fehler. Bitte versuche es später erneut.'
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="h-full flex flex-col bg-gradient-to-br from-purple-50 to-blue-50 border-purple-200">
      <CardContent className="p-4 flex flex-col h-full">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4 pb-4 border-b border-purple-200">
          <Sparkles className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-purple-900">KI-Assistent</h3>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto space-y-3 mb-4">
          {messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs rounded-lg px-4 py-2 ${
                  msg.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-none'
                    : 'bg-white text-gray-900 border border-purple-200 rounded-bl-none'
                }`}
              >
                <p className="text-sm leading-relaxed">{msg.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white text-gray-900 border border-purple-200 rounded-lg rounded-bl-none px-4 py-2">
                <Loader2 className="w-4 h-4 animate-spin text-purple-600" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Deine Frage..."
            className="flex-1 border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            disabled={loading}
          />
          <Button
            type="submit"
            disabled={loading || !input.trim()}
            size="sm"
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}