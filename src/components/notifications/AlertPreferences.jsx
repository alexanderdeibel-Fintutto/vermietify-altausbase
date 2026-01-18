import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Button } from '@/components/ui/button';
import { Settings, Save } from 'lucide-react';
import { showSuccess } from '@/components/notifications/ToastNotification';

export default function AlertPreferences() {
  const [prefs, setPrefs] = useState({
    paymentOverdue: true,
    contractExpiring: true,
    maintenanceDue: false,
    documentExpiring: true
  });

  const handleSave = () => {
    showSuccess('Einstellungen gespeichert');
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Benachrichtigungs-Einstellungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <VfSwitch
            label="Zahlungsverzug"
            description="Bei überfälligen Zahlungen"
            checked={prefs.paymentOverdue}
            onCheckedChange={(v) => setPrefs({ ...prefs, paymentOverdue: v })}
          />

          <VfSwitch
            label="Vertragsende"
            description="Wenn Verträge auslaufen"
            checked={prefs.contractExpiring}
            onCheckedChange={(v) => setPrefs({ ...prefs, contractExpiring: v })}
          />

          <VfSwitch
            label="Wartungsfällig"
            description="Bei anstehender Wartung"
            checked={prefs.maintenanceDue}
            onCheckedChange={(v) => setPrefs({ ...prefs, maintenanceDue: v })}
          />

          <VfSwitch
            label="Dokumentenablauf"
            description="Bei ablaufenden Dokumenten"
            checked={prefs.documentExpiring}
            onCheckedChange={(v) => setPrefs({ ...prefs, documentExpiring: v })}
          />

          <Button variant="gradient" className="w-full" onClick={handleSave}>
            <Save className="h-4 w-4 mr-2" />
            Speichern
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}