import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Toggle } from "@/components/ui/toggle";
import { Plus, Edit3, Trash2 } from 'lucide-react';

export default function AutomationRulesPage() {
  const rules = [
    { id: 1, name: 'Mietzahlung Erinnerung', trigger: 'Miete überfällig', action: 'Email versenden', enabled: true },
    { id: 2, name: 'Nebenkosten Abrechnung', trigger: 'Monatliches Enddatum', action: 'Abrechnung generieren', enabled: true },
    { id: 3, name: 'Wartungsmeldung', trigger: 'Inspektionsfällig', action: 'Benachrichtigung', enabled: false },
    { id: 4, name: 'Dokumentenarchiv', trigger: 'Dokument älter als 5 Jahre', action: 'Archivieren', enabled: true },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">⚙️ Automatisierungsregeln</h1>
          <p className="text-slate-600 mt-1">Erstellen und verwalten Sie Automatisierungen</p>
        </div>
        <Button className="bg-cyan-600 hover:bg-cyan-700"><Plus className="w-4 h-4 mr-2" />Neue Regel</Button>
      </div>

      <div className="space-y-3">
        {rules.map((rule) => (
          <Card key={rule.id} className="border border-slate-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-slate-900">{rule.name}</h3>
                    <Badge className={rule.enabled ? 'bg-green-600' : 'bg-slate-600'}>
                      {rule.enabled ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>
                  <p className="text-sm text-slate-600">
                    Wenn: <span className="font-medium">{rule.trigger}</span> → Dann: <span className="font-medium">{rule.action}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Toggle pressed={rule.enabled} className="data-[state=on]:bg-green-600" />
                  <Button size="icon" variant="ghost"><Edit3 className="w-4 h-4 text-blue-600" /></Button>
                  <Button size="icon" variant="ghost"><Trash2 className="w-4 h-4 text-red-600" /></Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}