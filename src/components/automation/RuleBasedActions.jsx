import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSwitch } from '@/components/shared/VfSwitch';
import { Zap } from 'lucide-react';

export default function RuleBasedActions() {
  const rules = [
    { id: 1, name: 'Auto-Mahnung bei Zahlungsverzug', enabled: true, trigger: '5 Tage nach Fälligkeit' },
    { id: 2, name: 'Erinnerung Vertragsverlängerung', enabled: true, trigger: '90 Tage vor Ende' },
    { id: 3, name: 'Automatische BK-Vorschreibung', enabled: false, trigger: 'Jährlich am 1. Januar' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Automatisierungs-Regeln
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {rules.map((rule) => (
            <div key={rule.id} className="flex items-start justify-between p-3 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex-1 mr-4">
                <div className="font-medium text-sm">{rule.name}</div>
                <div className="text-xs text-[var(--theme-text-muted)] mt-1">
                  Auslöser: {rule.trigger}
                </div>
              </div>
              <VfSwitch checked={rule.enabled} />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}