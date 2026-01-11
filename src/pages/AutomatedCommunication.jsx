import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';

export default function AutomatedCommunication() {
  const [automations, setAutomations] = useState([
    { id: 1, name: 'Zahlungserinnerung', trigger: 'Zahlung überfällig', channel: 'Email', enabled: true },
    { id: 2, name: 'Wartungsbestätigung', trigger: 'Wartung abgeschlossen', channel: 'SMS', enabled: true },
    { id: 3, name: 'Vertragsverlängerung', trigger: 'Vertrag endet in 30 Tagen', channel: 'Email', enabled: false },
  ]);

  const toggleAutomation = (id) => {
    setAutomations(automations.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a));
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-light text-slate-900">Automatisierte Kommunikation</h1>
          <p className="text-slate-600 font-light mt-2">Konfigurieren Sie automatische Nachrichtenabläufe</p>
        </div>
        <Button className="bg-blue-600 hover:bg-blue-700">
          <Plus className="w-4 h-4 mr-2" />
          Neue Automation
        </Button>
      </div>

      <div className="space-y-3">
        {automations.map(automation => (
          <Card key={automation.id}>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-medium text-slate-900">{automation.name}</h3>
                  <p className="text-sm text-slate-600 mt-1">
                    Trigger: {automation.trigger} → {automation.channel}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleAutomation(automation.id)}>
                    {automation.enabled ? (
                      <ToggleRight className="w-6 h-6 text-green-600" />
                    ) : (
                      <ToggleLeft className="w-6 h-6 text-slate-400" />
                    )}
                  </button>
                  <Button size="sm" variant="ghost">
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Vorlagen */}
      <Card>
        <CardHeader>
          <CardTitle>Automation Templates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {['Zahlungserinnerung', 'Wartungsankündigung', 'Willkommen', 'Vertragsverlängerung'].map(template => (
            <button key={template} className="p-3 border rounded-lg hover:bg-slate-50 text-left">
              <p className="text-sm font-medium">{template}</p>
              <p className="text-xs text-slate-500 mt-1">Template verwenden</p>
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}