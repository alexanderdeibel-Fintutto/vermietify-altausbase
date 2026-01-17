import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfNotificationCenter } from '@/components/notifications/VfNotificationCenter';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Bell, Mail, Smartphone } from 'lucide-react';

export default function NotificationManagement() {
  const queryClient = useQueryClient();
  
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const [emailPrefs, setEmailPrefs] = useState({
    paymentReceived: user?.email_payment_received ?? true,
    paymentOverdue: user?.email_payment_overdue ?? true,
    contractExpiring: user?.email_contract_expiring ?? true,
    documentGenerated: user?.email_document_generated ?? false,
    weeklyReport: user?.email_weekly_report ?? true
  });

  const [pushPrefs, setPushPrefs] = useState({
    urgentAlerts: user?.push_urgent_alerts ?? true,
    dailySummary: user?.push_daily_summary ?? false
  });

  const updateMutation = useMutation({
    mutationFn: (data) => base44.auth.updateMe(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
    }
  });

  const handleSave = () => {
    updateMutation.mutate({
      email_payment_received: emailPrefs.paymentReceived,
      email_payment_overdue: emailPrefs.paymentOverdue,
      email_contract_expiring: emailPrefs.contractExpiring,
      email_document_generated: emailPrefs.documentGenerated,
      email_weekly_report: emailPrefs.weeklyReport,
      push_urgent_alerts: pushPrefs.urgentAlerts,
      push_daily_summary: pushPrefs.dailySummary
    });
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">Benachrichtigungen</h1>
        <p className="text-[var(--theme-text-secondary)]">
          Verwalten Sie Ihre E-Mail- und Push-Benachrichtigungen
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                E-Mail-Benachrichtigungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Zahlungseingang</Label>
                <Switch 
                  checked={emailPrefs.paymentReceived}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, paymentReceived: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Zahlungsverzug</Label>
                <Switch 
                  checked={emailPrefs.paymentOverdue}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, paymentOverdue: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Vertragsende</Label>
                <Switch 
                  checked={emailPrefs.contractExpiring}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, contractExpiring: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Dokument erstellt</Label>
                <Switch 
                  checked={emailPrefs.documentGenerated}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, documentGenerated: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Wöchentlicher Bericht</Label>
                <Switch 
                  checked={emailPrefs.weeklyReport}
                  onCheckedChange={(v) => setEmailPrefs({ ...emailPrefs, weeklyReport: v })}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Push-Benachrichtigungen
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label>Dringende Meldungen</Label>
                <Switch 
                  checked={pushPrefs.urgentAlerts}
                  onCheckedChange={(v) => setPushPrefs({ ...pushPrefs, urgentAlerts: v })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label>Tägliche Zusammenfassung</Label>
                <Switch 
                  checked={pushPrefs.dailySummary}
                  onCheckedChange={(v) => setPushPrefs({ ...pushPrefs, dailySummary: v })}
                />
              </div>
            </CardContent>
          </Card>

          <Button 
            variant="gradient" 
            onClick={handleSave}
            disabled={updateMutation.isPending}
          >
            {updateMutation.isPending ? 'Wird gespeichert...' : 'Einstellungen speichern'}
          </Button>
        </div>

        <div>
          <VfNotificationCenter />
        </div>
      </div>
    </div>
  );
}