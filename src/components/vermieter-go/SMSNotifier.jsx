import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

export default function SMSNotifier() {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const sendSMS = () => {
    // Placeholder for SMS integration
    toast.success('SMS-Funktion aktiviert');
    setPhone('');
    setMessage('');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <MessageSquare className="w-4 h-4" />
          SMS-Benachrichtigung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="tel"
          placeholder="Telefonnummer"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
        />
        <Textarea
          placeholder="Nachricht..."
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={3}
        />
        <Button onClick={sendSMS} disabled={!phone || !message} className="w-full">
          SMS senden
        </Button>
      </CardContent>
    </Card>
  );
}