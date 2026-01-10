import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Bell, Mail } from 'lucide-react';

export default function NotificationPreferencesDialog({ onClose }) {
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me()
  });

  const { data: preferences } = useQuery({
    queryKey: ['notification-preferences', user?.email],
    queryFn: async () => {
      const prefs = await base44.entities.NotificationPreference.filter({ user_email: user.email });
      return prefs[0] || {
        user_email: user.email,
        email_enabled: true,
        in_app_enabled: true,
        payment_reminders: true,
        maintenance_updates: true,
        contract_renewals: true,
        new_messages: true,
        document_updates: true,
        system_updates: false,
        support_tickets: true
      };
    },
    enabled: !!user
  });

  const [settings, setSettings] = useState(preferences || {});

  React.useEffect(() => {
    if (preferences) setSettings(preferences);
  }, [preferences]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (preferences?.id) {
        await base44.entities.NotificationPreference.update(preferences.id, settings);
      } else {
        await base44.entities.NotificationPreference.create(settings);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notification-preferences']);
      toast.success('Einstellungen gespeichert');
      onClose();
    }
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Benachrichtigungseinstellungen</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Benachrichtigungskanäle
            </h3>
            
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">In-App Benachrichtigungen</p>
                <p className="text-xs text-slate-600">Benachrichtigungen in der App anzeigen</p>
              </div>
              <Switch
                checked={settings.in_app_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, in_app_enabled: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">E-Mail Benachrichtigungen</p>
                <p className="text-xs text-slate-600">Benachrichtigungen per E-Mail erhalten</p>
              </div>
              <Switch
                checked={settings.email_enabled}
                onCheckedChange={(checked) => setSettings({ ...settings, email_enabled: checked })}
              />
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <h3 className="font-semibold flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Benachrichtigungstypen
            </h3>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Zahlungserinnerungen</p>
                <p className="text-xs text-slate-600">Überfällige und bevorstehende Zahlungen</p>
              </div>
              <Switch
                checked={settings.payment_reminders}
                onCheckedChange={(checked) => setSettings({ ...settings, payment_reminders: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Wartungsupdates</p>
                <p className="text-xs text-slate-600">Neue und aktualisierte Wartungsanfragen</p>
              </div>
              <Switch
                checked={settings.maintenance_updates}
                onCheckedChange={(checked) => setSettings({ ...settings, maintenance_updates: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Vertragsverlängerungen</p>
                <p className="text-xs text-slate-600">Auslaufende Verträge</p>
              </div>
              <Switch
                checked={settings.contract_renewals}
                onCheckedChange={(checked) => setSettings({ ...settings, contract_renewals: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Neue Nachrichten</p>
                <p className="text-xs text-slate-600">Nachrichten von Mietern/Verwaltung</p>
              </div>
              <Switch
                checked={settings.new_messages}
                onCheckedChange={(checked) => setSettings({ ...settings, new_messages: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Dokumenten-Updates</p>
                <p className="text-xs text-slate-600">Neue oder aktualisierte Dokumente</p>
              </div>
              <Switch
                checked={settings.document_updates}
                onCheckedChange={(checked) => setSettings({ ...settings, document_updates: checked })}
              />
            </div>

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">System-Updates</p>
                <p className="text-xs text-slate-600">Wartung und neue Features</p>
              </div>
              <Switch
                checked={settings.system_updates}
                onCheckedChange={(checked) => setSettings({ ...settings, system_updates: checked })}
              />
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={onClose} variant="outline" className="flex-1">
              Abbrechen
            </Button>
            <Button onClick={() => saveMutation.mutate()} className="flex-1">
              Speichern
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}