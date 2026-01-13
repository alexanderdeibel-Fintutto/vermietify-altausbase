import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

const NOTIFICATION_TYPES = [
  { id: 'invoice_created', label: 'Rechnung erstellt' },
  { id: 'invoice_paid', label: 'Rechnung bezahlt' },
  { id: 'invoice_overdue', label: 'Rechnung überfällig' },
  { id: 'contract_expiring', label: 'Vertrag endet bald' },
  { id: 'payment_received', label: 'Zahlung erhalten' }
];

export default function SlackNotifications() {
  const [channel, setChannel] = useState('#operations');
  const [notifications, setNotifications] = useState(new Set(['invoice_overdue']));
  const queryClient = useQueryClient();

  const { data: config } = useQuery({
    queryKey: ['slack-config'],
    queryFn: async () => {
      const response = await base44.functions.invoke('getSlackConfig', {});
      return response.data;
    }
  });

  const configureMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('configureSlackNotifications', {
        channel: channel,
        enabledNotifications: Array.from(notifications)
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Slack konfiguriert');
      queryClient.invalidateQueries(['slack-config']);
    }
  });

  const testMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('sendSlackTestMessage', {
        channel: channel
      });
      return response.data;
    },
    onSuccess: () => {
      toast.success('✅ Test-Nachricht gesendet');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          💬 Slack Integrationen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {config?.connected ? (
          <>
            <Alert className="border-emerald-200 bg-emerald-50">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <AlertDescription className="text-sm text-emerald-800">
                ✅ Mit Slack verbunden
              </AlertDescription>
            </Alert>

            <div>
              <label className="text-sm font-medium">Channel</label>
              <Input
                placeholder="#channel-name"
                value={channel}
                onChange={(e) => setChannel(e.target.value)}
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium">Benachrichtigungen</p>
              {NOTIFICATION_TYPES.map(type => (
                <label key={type.id} className="flex items-center gap-2 cursor-pointer">
                  <Checkbox
                    checked={notifications.has(type.id)}
                    onCheckedChange={(checked) => {
                      const updated = new Set(notifications);
                      if (checked) {
                        updated.add(type.id);
                      } else {
                        updated.delete(type.id);
                      }
                      setNotifications(updated);
                    }}
                  />
                  <span className="text-sm">{type.label}</span>
                </label>
              ))}
            </div>

            <div className="flex gap-2 pt-2 border-t">
              <Button
                size="sm"
                variant="outline"
                onClick={() => testMutation.mutate()}
                disabled={testMutation.isPending}
              >
                Test senden
              </Button>
              <Button
                size="sm"
                onClick={() => configureMutation.mutate()}
                disabled={configureMutation.isPending}
              >
                Speichern
              </Button>
            </div>
          </>
        ) : (
          <Alert className="border-orange-200 bg-orange-50">
            <AlertTriangle className="w-4 h-4 text-orange-600" />
            <AlertDescription className="text-sm text-orange-800">
              ⚠️ Slack ist nicht verbunden
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}