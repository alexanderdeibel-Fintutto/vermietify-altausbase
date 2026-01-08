import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Clock, Database, Trash2 } from 'lucide-react';

export default function DataRetentionPolicy() {
  const policies = [
    {
      category: 'Benutzerdaten',
      retention: 'Bis zur Löschung',
      description: 'Persönliche Informationen werden bis zur aktiven Löschung durch Admin aufbewahrt',
      icon: Database,
      color: 'blue'
    },
    {
      category: 'Aktivitäts-Logs',
      retention: '2 Jahre',
      description: 'Logs werden 2 Jahre für Audit-Zwecke aufbewahrt, dann automatisch gelöscht',
      icon: Clock,
      color: 'green'
    },
    {
      category: 'Test-Sessions',
      retention: '1 Jahr',
      description: 'Tester-Daten werden 1 Jahr aufbewahrt für Analyse-Zwecke',
      icon: Clock,
      color: 'purple'
    },
    {
      category: 'Gelöschte Accounts',
      retention: '30 Tage',
      description: 'Anonymisierte Daten gelöschter Accounts für rechtliche Absicherung',
      icon: Trash2,
      color: 'orange'
    }
  ];

  const getColorClasses = (color) => {
    const colors = {
      blue: 'bg-blue-50 border-blue-200 text-blue-900',
      green: 'bg-green-50 border-green-200 text-green-900',
      purple: 'bg-purple-50 border-purple-200 text-purple-900',
      orange: 'bg-orange-50 border-orange-200 text-orange-900'
    };
    return colors[color] || colors.blue;
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Aufbewahrungsrichtlinien</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {policies.map((policy, idx) => {
            const Icon = policy.icon;
            return (
              <div 
                key={idx}
                className={`p-4 border rounded-lg ${getColorClasses(policy.color)}`}
              >
                <div className="flex items-start gap-3">
                  <Icon className="w-5 h-5 mt-0.5" />
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{policy.category}</h3>
                      <Badge variant="outline" className="bg-white">
                        {policy.retention}
                      </Badge>
                    </div>
                    <p className="text-sm">{policy.description}</p>
                  </div>
                </div>
              </div>
            );
          })}

          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <h4 className="font-semibold mb-2">Automatische Prozesse</h4>
            <ul className="text-sm text-slate-700 space-y-1">
              <li>• Aktivitäts-Logs älter als 2 Jahre werden monatlich gelöscht</li>
              <li>• Test-Sessions älter als 1 Jahr werden vierteljährlich archiviert</li>
              <li>• Anonymisierte Account-Daten werden nach 30 Tagen endgültig gelöscht</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}