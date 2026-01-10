import React, { useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, BellOff } from 'lucide-react';
import { toast } from 'sonner';
import { usePushNotifications } from '@/components/mobile/usePushNotifications';

export default function PushNotifications() {
  const { permission, subscribe, unsubscribe } = usePushNotifications();

  const handleSubscribe = async () => {
    try {
      await subscribe();
      toast.success('Benachrichtigungen aktiviert');
    } catch (error) {
      toast.error('Aktivierung fehlgeschlagen');
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Push-Benachrichtigungen
          <Badge className={
            permission === 'granted' ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-800'
          }>
            {permission === 'granted' ? 'Aktiv' : 'Inaktiv'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">
          Erhalten Sie sofortige Benachrichtigungen über neue Nachrichten, fällige Aufgaben und wichtige Ereignisse.
        </p>
        
        {permission === 'granted' ? (
          <Button
            variant="outline"
            onClick={unsubscribe}
            className="w-full"
          >
            <BellOff className="w-4 h-4 mr-2" />
            Deaktivieren
          </Button>
        ) : (
          <Button
            onClick={handleSubscribe}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            <Bell className="w-4 h-4 mr-2" />
            Aktivieren
          </Button>
        )}
      </CardContent>
    </Card>
  );
}