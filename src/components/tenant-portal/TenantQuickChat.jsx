import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMessages, sendMessage, createTenantConversation } from '../services/messaging';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function TenantQuickChat({ tenantEmail, unitId, buildingId, tenantName }) {
  const [isOpen, setIsOpen] = useState(false);
  const [conversationId, setConversationId] = useState(null);
  const [input, setInput] = useState('');
  const queryClient = useQueryClient();
  
  // Conversation laden/erstellen
  useEffect(() => {
    if (isOpen && !conversationId) {
      initConversation();
    }
  }, [isOpen]);
  
  async function initConversation() {
    const result = await createTenantConversation(
      tenantEmail,
      unitId,
      buildingId,
      `Chat mit ${tenantName}`
    );
    
    if (result.success) {
      setConversationId(result.conversation.id);
    }
  }
  
  const { data: messages = [], refetch } = useQuery({
    queryKey: ['quick-chat-messages', conversationId],
    queryFn: () => conversationId ? getMessages(conversationId, { limit: 20 }) : [],
    enabled: !!conversationId,
    refetchInterval: 5000
  });
  
  const sendMutation = useMutation({
    mutationFn: () => sendMessage(conversationId, input),
    onSuccess: () => {
      setInput('');
      refetch();
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  });
  
  if (!isOpen) {
    return (
      <Button
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <MessageSquare className="w-4 h-4" />
        Chat mit Mieter
      </Button>
    );
  }
  
  return (
    <Card className="w-full">
      <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
        <span className="font-semibold text-sm">Chat mit {tenantName}</span>
        <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
          Schließen
        </Button>
      </div>
      
      <div className="h-64 overflow-y-auto p-3 space-y-2 bg-white">
        {!conversationId ? (
          <div className="flex items-center justify-center h-full">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-500 text-sm py-12">
            Keine Nachrichten
          </div>
        ) : (
          messages.map(msg => (
            <div
              key={msg.id}
              className={`flex ${msg.sender_email === tenantEmail ? 'justify-start' : 'justify-end'}`}
            >
              <div className={`max-w-[80%] px-3 py-2 rounded-lg text-sm ${
                msg.sender_email === tenantEmail
                  ? 'bg-gray-100 text-gray-900'
                  : 'bg-blue-600 text-white'
              }`}>
                {msg.content}
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="p-3 border-t bg-gray-50">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && !sendMutation.isPending && sendMutation.mutate()}
            placeholder="Nachricht..."
            className="text-sm"
            disabled={!conversationId || sendMutation.isPending}
          />
          <Button
            onClick={() => sendMutation.mutate()}
            disabled={!input.trim() || !conversationId || sendMutation.isPending}
            size="sm"
          >
            {sendMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
      </div>
    </Card>
  );
}