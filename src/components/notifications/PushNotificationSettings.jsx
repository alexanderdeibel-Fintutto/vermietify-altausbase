import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function PushNotificationSettings() {
  const [enabled, setEnabled] = React.useState(false);

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'your-vapid-public-key'
      });
      await base44.functions.invoke('savePushSubscription', { subscription });
    },
    onSuccess: () => {
      setEnabled(true);
      toast.success('Push-Benachrichtigungen aktiviert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="w-5 h-5" />
          Push-Benachrichtigungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm">Aktiviert</span>
          <Switch checked={enabled} onCheckedChange={(checked) => checked && subscribeMutation.mutate()} />
        </div>
        <p className="text-xs text-slate-600">
          Erhalten Sie wichtige Updates direkt auf Ihr Gerät
        </p>
      </CardContent>
    </Card>
  );
}