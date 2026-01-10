import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Bell } from 'lucide-react';
import { toast } from 'sonner';

export default function PushNotificationSettings() {
  const queryClient = useQueryClient();

  const { data: settings } = useQuery({
    queryKey: ['pushSettings'],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.list(null, 1);
      return prefs[0] || { push_enabled: false };
    }
  });

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: 'YOUR_VAPID_PUBLIC_KEY'
      });
      await base44.functions.invoke('savePushSubscription', { subscription });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pushSettings'] });
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
          <span className="text-sm">Browser-Benachrichtigungen</span>
          <Switch checked={settings?.push_enabled} />
        </div>
        <Button onClick={() => subscribeMutation.mutate()} className="w-full">
          Aktivieren
        </Button>
      </CardContent>
    </Card>
  );
}