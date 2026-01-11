import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Bell, Check } from 'lucide-react';

export default function PushNotificationSetup({ tenantId, companyId }) {
  const [notificationPrefs, setNotificationPrefs] = useState({
    maintenance_updates: true,
    new_documents: true,
    new_messages: true,
    payment_reminders: true,
    community_posts: false
  });

  const savePrefsMutation = useMutation({
    mutationFn: async () => {
      const sessions = await base44.entities.TenantAppSession.filter({ tenant_id: tenantId });
      if (sessions.length > 0) {
        await base44.entities.TenantAppSession.update(sessions[0].id, {
          notification_preferences: notificationPrefs
        });
      } else {
        await base44.entities.TenantAppSession.create({
          tenant_id: tenantId,
          company_id: companyId,
          notification_preferences: notificationPrefs
        });
      }
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Bell className="w-4 h-4" />
          Push-Benachrichtigungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {[
            { key: 'maintenance_updates', label: 'Wartungsupdates' },
            { key: 'new_documents', label: 'Neue Dokumente' },
            { key: 'new_messages', label: 'Neue Nachrichten' },
            { key: 'payment_reminders', label: 'Zahlungserinnerungen' },
            { key: 'community_posts', label: 'Community-Beiträge' }
          ].map(pref => (
            <div key={pref.key} className="flex items-center justify-between">
              <span className="text-sm">{pref.label}</span>
              <Switch
                checked={notificationPrefs[pref.key]}
                onCheckedChange={(checked) =>
                  setNotificationPrefs({ ...notificationPrefs, [pref.key]: checked })
                }
              />
            </div>
          ))}
        </div>

        <Button
          onClick={() => savePrefsMutation.mutate()}
          className="w-full"
        >
          <Check className="w-4 h-4 mr-2" />
          Einstellungen speichern
        </Button>
      </CardContent>
    </Card>
  );
}