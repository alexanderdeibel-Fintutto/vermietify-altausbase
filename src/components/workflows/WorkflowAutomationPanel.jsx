import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Zap, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const AUTOMATION_RULES = [
  {
    id: 'contract_expiry_task',
    name: 'Mietvertrag-Ablauf Tasks',
    description: 'Erstelle automatisch Tasks, wenn Mietverträge in 60 Tagen ablaufen',
    triggers: ['contract_nearing_expiry'],
    actions: ['create_follow_up_task', 'send_notification'],
    enabled: true,
    runSchedule: 'Wöchentlich (Montag 8:00)'
  },
  {
    id: 'critical_alert_notification',
    name: 'Kritische Alerts',
    description: 'Benachrichtige Admins sofort bei kritischen Problemen',
    triggers: ['critical_alert_logged'],
    actions: ['create_notification', 'create_task', 'send_slack'],
    enabled: true,
    runSchedule: 'Echtzeit'
  },
  {
    id: 'auto_task_assignment',
    name: 'Automatische Task-Zuordnung',
    description: 'Weise neue Tasks automatisch an verfügbare Manager zu',
    triggers: ['task_created', 'task_status_changed'],
    actions: ['assign_to_manager', 'send_notification'],
    enabled: false,
    runSchedule: 'Sofort nach Auslöser'
  },
  {
    id: 'overdue_rent_reminder',
    name: 'Überfällige Miete',
    description: 'Benachrichtige Mieter bei überfälliger Miete',
    triggers: ['payment_overdue'],
    actions: ['send_reminder', 'create_notification'],
    enabled: true,
    runSchedule: 'Täglich'
  }
];

export default function WorkflowAutomationPanel() {
  const [selectedRule, setSelectedRule] = useState(null);
  const queryClient = useQueryClient();

  const { data: automations = [] } = useQuery({
    queryKey: ['workflow-automations'],
    queryFn: async () => {
      try {
        return await base44.entities.WorkflowAutomation.list();
      } catch {
        return [];
      }
    }
  });

  const toggleAutomation = useMutation({
    mutationFn: async (rule) => {
      const existing = automations.find(a => a.name === rule.name);
      if (existing) {
        return base44.entities.WorkflowAutomation.update(existing.id, {
          is_active: !existing.is_active
        });
      } else {
        return base44.asServiceRole.entities.WorkflowAutomation.create({
          name: rule.name,
          description: rule.description,
          trigger_type: 'event',
          trigger_config: { events: rule.triggers },
          conditions: [],
          actions: rule.actions.map(a => ({ type: a })),
          is_active: true
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['workflow-automations']);
    }
  });

  const isAutomationActive = (rule) => {
    const automation = automations.find(a => a.name === rule.name);
    return automation?.is_active ?? rule.enabled;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">Workflow-Automatisierung</h2>
          <p className="text-slate-600 mt-1">Richten Sie automatische Aktionen für häufige Aufgaben ein</p>
        </div>
        <Badge variant="outline" className="bg-green-50">
          <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
          Aktiv
        </Badge>
      </div>

      <div className="grid gap-4">
        {AUTOMATION_RULES.map(rule => (
          <Card 
            key={rule.id}
            className="cursor-pointer hover:shadow-lg transition-shadow"
            onClick={() => setSelectedRule(rule)}
          >
            <CardContent className="pt-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Zap className="w-5 h-5 text-yellow-600" />
                    <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                  </div>
                  <p className="text-sm text-slate-600 mb-3">{rule.description}</p>
                  
                  <div className="space-y-2 text-xs">
                    <div>
                      <span className="font-medium text-slate-700">Auslöser: </span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {rule.triggers.map(t => (
                          <Badge key={t} variant="outline" className="bg-blue-50 text-blue-700">
                            {t.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-slate-700">Aktionen: </span>
                      <div className="flex gap-1 mt-1 flex-wrap">
                        {rule.actions.map(a => (
                          <Badge key={a} variant="outline" className="bg-green-50 text-green-700">
                            {a.replace(/_/g, ' ')}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="text-slate-500">
                      ⏱️ {rule.runSchedule}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-3">
                  <Switch
                    checked={isAutomationActive(rule)}
                    onCheckedChange={() => toggleAutomation.mutate(rule)}
                    onClick={(e) => e.stopPropagation()}
                  />
                  {isAutomationActive(rule) && (
                    <Badge className="bg-green-100 text-green-800">Aktiv</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedRule && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertCircle className="w-5 h-5 text-blue-600" />
              {selectedRule.name} - Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div>
              <p className="font-semibold text-slate-700">Beschreibung:</p>
              <p className="text-slate-600 mt-1">{selectedRule.description}</p>
            </div>
            <div>
              <p className="font-semibold text-slate-700">Wie funktioniert es:</p>
              <ul className="list-disc list-inside text-slate-600 mt-1 space-y-1">
                {selectedRule.id === 'contract_expiry_task' && (
                  <>
                    <li>Prüfung aller aktiven Mietverträge jede Woche</li>
                    <li>Identifizierung von Verträgen mit &lt;60 Tagen Restlaufzeit</li>
                    <li>Automatische Task-Erstellung mit Priorität</li>
                    <li>Benachrichtigung an Admin</li>
                  </>
                )}
                {selectedRule.id === 'critical_alert_notification' && (
                  <>
                    <li>Erfassung aller kritischen Alerts in Echtzeit</li>
                    <li>Sofortige Benachrichtigung aller Admins</li>
                    <li>Automatische Task für sofortige Bearbeitung</li>
                    <li>Slack-Nachricht an #alerts</li>
                  </>
                )}
                {selectedRule.id === 'auto_task_assignment' && (
                  <>
                    <li>Überwachung neu erstellter Tasks</li>
                    <li>Automatische Zuordnung an verfügbare Manager</li>
                    <li>Benachrichtigung des zugewiesenen Managers</li>
                  </>
                )}
                {selectedRule.id === 'overdue_rent_reminder' && (
                  <>
                    <li>Tägliche Überprüfung auf überfällige Zahlungen</li>
                    <li>Automatische Erinnerungsmitteilung an Mieter</li>
                    <li>Benachrichtigung für Admin nach 7 Tagen Verspätung</li>
                  </>
                )}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}