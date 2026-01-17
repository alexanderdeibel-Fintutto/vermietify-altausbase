import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Button } from '@/components/ui/button';
import { Send, MessageSquare } from 'lucide-react';
import TimeAgo from '@/components/shared/TimeAgo';

export default function MessageThread({ tenantId, messages = [] }) {
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (newMessage.trim()) {
      console.log('Sending message:', newMessage);
      setNewMessage('');
    }
  };

  const mockMessages = [
    { id: 1, content: 'Hallo, die Heizung funktioniert nicht.', sender: 'tenant', created_date: '2026-01-15T10:30:00' },
    { id: 2, content: 'Vielen Dank für die Meldung. Ich kümmere mich darum.', sender: 'admin', created_date: '2026-01-15T11:00:00' }
  ];

  const displayMessages = messages.length > 0 ? messages : mockMessages;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Nachrichten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {displayMessages.map((msg) => (
              <div
                key={msg.id}
                className={`p-3 rounded-lg ${
                  msg.sender === 'admin' 
                    ? 'bg-[var(--vf-primary-100)] ml-8' 
                    : 'bg-[var(--theme-surface)] mr-8'
                }`}
              >
                <p className="text-sm">{msg.content}</p>
                <TimeAgo date={msg.created_date} className="text-xs text-[var(--theme-text-muted)] mt-2" />
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-4 border-t">
            <VfTextarea
              placeholder="Nachricht schreiben..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              className="flex-1"
            />
            <Button 
              variant="gradient"
              onClick={handleSend}
              disabled={!newMessage.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}