import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function WhatsAppMessenger() {
  const [message, setMessage] = useState('');

  const sendWhatsApp = () => {
    const text = encodeURIComponent(message);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setMessage('');
    toast.success('WhatsApp geöffnet');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageCircle className="w-4 h-4" />
          WhatsApp
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Textarea
          placeholder="Nachricht..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
        <Button onClick={sendWhatsApp} disabled={!message} className="w-full bg-green-600">
          <MessageCircle className="w-4 h-4 mr-2" />
          Mit WhatsApp senden
        </Button>
      </CardContent>
    </Card>
  );
}