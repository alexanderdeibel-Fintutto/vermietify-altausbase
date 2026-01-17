import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Zap, Plus } from 'lucide-react';

export default function RuleBasedActions() {
  const [rules, setRules] = useState([]);
  const [newRule, setNewRule] = useState({
    trigger: '',
    action: ''
  });

  const addRule = () => {
    if (newRule.trigger && newRule.action) {
      setRules([...rules, newRule]);
      setNewRule({ trigger: '', action: '' });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Zap className="h-5 w-5" />
          Automatisierungs-Regeln
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <VfSelect
              label="Wenn..."
              value={newRule.trigger}
              onChange={(v) => setNewRule({ ...newRule, trigger: v })}
              options={[
                { value: 'payment_overdue', label: 'Zahlung überfällig' },
                { value: 'contract_expiring', label: 'Vertrag läuft aus' },
                { value: 'maintenance_request', label: 'Wartungsanfrage erstellt' }
              ]}
            />

            <VfSelect
              label="Dann..."
              value={newRule.action}
              onChange={(v) => setNewRule({ ...newRule, action: v })}
              options={[
                { value: 'send_email', label: 'E-Mail senden' },
                { value: 'create_task', label: 'Aufgabe erstellen' },
                { value: 'send_notification', label: 'Benachrichtigung senden' }
              ]}
            />
          </div>

          <Button variant="outline" onClick={addRule} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Regel hinzufügen
          </Button>

          {rules.length > 0 && (
            <div className="space-y-2 mt-4">
              {rules.map((rule, index) => (
                <div key={index} className="p-3 bg-[var(--theme-surface)] rounded-lg text-sm">
                  <span className="font-medium">Wenn</span> {rule.trigger} → <span className="font-medium">Dann</span> {rule.action}
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}