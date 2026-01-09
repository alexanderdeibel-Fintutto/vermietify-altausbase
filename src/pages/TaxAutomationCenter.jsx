import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Zap, Plus } from 'lucide-react';

export default function TaxAutomationCenter() {
  const [ruleName, setRuleName] = useState('');
  const [triggerType, setTriggerType] = useState('deadline');
  const [actionType, setActionType] = useState('reminder');
  const [schedule, setSchedule] = useState('daily');
  const [creating, setCreating] = useState(false);

  const { data: automations = [] } = useQuery({
    queryKey: ['automationRules'],
    queryFn: async () => {
      const response = await base44.entities.AutomationConfig.filter({ is_enabled: true });
      return response || [];
    }
  });

  const handleCreateRule = async () => {
    if (!ruleName) return;
    setCreating(true);
    await base44.functions.invoke('createAutomationRule', {
      rule_name: ruleName,
      trigger_type: triggerType,
      action_type: actionType,
      schedule
    });
    setRuleName('');
    setCreating(false);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">⚙️ Steuerautomations-Zentrum</h1>
        <p className="text-slate-500 mt-1">Automatisieren Sie wiederkehrende Steuertasks</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Neue Automatisierungsregel</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="Regelname (z.B. 'Wöchentliche Überprüfung')"
            value={ruleName}
            onChange={(e) => setRuleName(e.target.value)}
            disabled={creating}
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Auslöser</label>
              <Select value={triggerType} onValueChange={setTriggerType} disabled={creating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="deadline">Frist nahend</SelectItem>
                  <SelectItem value="status_change">Status-Änderung</SelectItem>
                  <SelectItem value="schedule">Zeitplan</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Aktion</label>
              <Select value={actionType} onValueChange={setActionType} disabled={creating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reminder">Erinnerung</SelectItem>
                  <SelectItem value="report">Bericht</SelectItem>
                  <SelectItem value="notification">Benachrichtigung</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Zeitplan</label>
              <Select value={schedule} onValueChange={setSchedule} disabled={creating}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Täglich</SelectItem>
                  <SelectItem value="weekly">Wöchentlich</SelectItem>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={handleCreateRule}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white gap-2"
            disabled={creating || !ruleName}
          >
            <Plus className="w-4 h-4" />
            Regel erstellen
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm flex items-center gap-2">
            <Zap className="w-4 h-4" />
            Aktive Regeln ({automations.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {automations.length === 0 ? (
            <p className="text-sm text-slate-500">Noch keine Automatisierungsregeln erstellt</p>
          ) : (
            <div className="space-y-2">
              {automations.map(auto => (
                <div key={auto.id} className="p-3 bg-slate-50 rounded">
                  <p className="font-medium text-sm">{auto.configuration?.rule_name}</p>
                  <p className="text-xs text-slate-600 mt-1">
                    {auto.automation_type} • {auto.schedule}
                  </p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}