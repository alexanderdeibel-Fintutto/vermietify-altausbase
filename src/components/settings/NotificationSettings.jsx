import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Save } from 'lucide-react';
import { toast } from 'sonner';

export default function NotificationSettings({ user }) {
  const [settings, setSettings] = useState({
    email_notifications: user.email_notifications ?? true,
    payment_reminders: user.payment_reminders ?? true,
    system_updates: user.system_updates ?? true,
    marketing_emails: user.marketing_emails ?? false,
    whatsapp_notifications: user.whatsapp_notifications ?? false,
    sms_notifications: user.sms_notifications ?? false
  });
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['current-user'] });
      toast.success('Benachrichtigungen aktualisiert');
    }
  });

  const handleSave = () => {
    updateMutation.mutate(settings);
  };

  return (
    <div className="space-y-6 pt-4">
      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">E-Mail Benachrichtigungen</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Allgemeine Benachrichtigungen</Label>
                <p className="text-sm text-slate-600">Erhalten Sie Updates über wichtige Ereignisse</p>
              </div>
              <Switch
                checked={settings.email_notifications}
                onCheckedChange={(checked) => setSettings({...settings, email_notifications: checked})}
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Zahlungserinnerungen</Label>
                <p className="text-sm text-slate-600">Benachrichtigungen über fällige Zahlungen</p>
              </div>
              <Switch
                checked={settings.payment_reminders}
                onCheckedChange={(checked) => setSettings({...settings, payment_reminders: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>System-Updates</Label>
                <p className="text-sm text-slate-600">Informationen über neue Funktionen</p>
              </div>
              <Switch
                checked={settings.system_updates}
                onCheckedChange={(checked) => setSettings({...settings, system_updates: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>Marketing & Newsletter</Label>
                <p className="text-sm text-slate-600">Tipps und Angebote erhalten</p>
              </div>
              <Switch
                checked={settings.marketing_emails}
                onCheckedChange={(checked) => setSettings({...settings, marketing_emails: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <h3 className="font-medium mb-4">Weitere Kanäle</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>WhatsApp Benachrichtigungen</Label>
                <p className="text-sm text-slate-600">Wichtige Updates via WhatsApp</p>
              </div>
              <Switch
                checked={settings.whatsapp_notifications}
                onCheckedChange={(checked) => setSettings({...settings, whatsapp_notifications: checked})}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="flex-1">
                <Label>SMS Benachrichtigungen</Label>
                <p className="text-sm text-slate-600">Kritische Meldungen per SMS</p>
              </div>
              <Switch
                checked={settings.sms_notifications}
                onCheckedChange={(checked) => setSettings({...settings, sms_notifications: checked})}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSave} disabled={updateMutation.isPending} className="bg-emerald-600 hover:bg-emerald-700">
        <Save className="w-4 h-4 mr-2" />
        Einstellungen speichern
      </Button>
    </div>
  );
}