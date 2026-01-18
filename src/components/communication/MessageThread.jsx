import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfTextarea } from '@/components/shared/VfTextarea';
import { Button } from '@/components/ui/button';
import TimeAgo from '@/components/shared/TimeAgo';
import { MessageCircle, Send } from 'lucide-react';

export default function MessageThread({ tenantId }) {
  const [messages, setMessages] = useState([
    { id: 1, sender: 'tenant', text: 'Die Heizung funktioniert nicht', created_date: new Date(Date.now() - 3600000) },
    { id: 2, sender: 'admin', text: 'Vielen Dank für die Meldung. Wir kümmern uns darum.', created_date: new Date() }
  ]);
  const [newMessage, setNewMessage] = useState('');

  const handleSend = () => {
    if (!newMessage.trim()) return;
    setMessages([...messages, {
      id: Date.now(),
      sender: 'admin',
      text: newMessage,
      created_date: new Date()
    }]);
    setNewMessage('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          Nachrichten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={`p-3 rounded-lg ${
                msg.sender === 'admin' 
                  ? 'bg-[var(--theme-primary-light)] ml-8' 
                  : 'bg-[var(--theme-surface)] mr-8'
              }`}
            >
              <p className="text-sm mb-1">{msg.text}</p>
              <TimeAgo date={msg.created_date} className="text-xs text-[var(--theme-text-muted)]" />
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          <VfTextarea
            placeholder="Nachricht schreiben..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            rows={2}
            className="flex-1"
          />
          <Button variant="gradient" onClick={handleSend}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}