import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { VfSelect } from '@/components/shared/VfSelect';
import { Mail } from 'lucide-react';

export default function EmailDigestSettings() {
  const [enabled, setEnabled] = useState(true);
  const [frequency, setFrequency] = useState('weekly');

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5" />
          E-Mail Zusammenfassungen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium text-sm">Zusammenfassungen aktivieren</div>
              <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                Erhalten Sie regelmäßige Updates per E-Mail
              </div>
            </div>
            <VfSwitch checked={enabled} onCheckedChange={setEnabled} />
          </div>

          {enabled && (
            <VfSelect
              label="Häufigkeit"
              value={frequency}
              onChange={setFrequency}
              options={[
                { value: 'daily', label: 'Täglich' },
                { value: 'weekly', label: 'Wöchentlich' },
                { value: 'monthly', label: 'Monatlich' }
              ]}
            />
          )}
        </div>
      </CardContent>
    </Card>
  );
}