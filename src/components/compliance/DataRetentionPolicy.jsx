import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Database } from 'lucide-react';

export default function DataRetentionPolicy() {
  const policies = [
    {
      entity: 'User',
      retention: 'Unbegrenzt (solange Account aktiv)',
      deletion: 'Bei Account-Löschung oder auf Anfrage (GDPR)',
      category: 'Personenbezogen'
    },
    {
      entity: 'UserActivity',
      retention: '2 Jahre',
      deletion: 'Automatisch nach Ablauf',
      category: 'Logs'
    },
    {
      entity: 'TestSession',
      retention: '1 Jahr',
      deletion: 'Automatisch nach Ablauf',
      category: 'Logs'
    },
    {
      entity: 'APIKey',
      retention: 'Bis Widerruf',
      deletion: 'Manuell oder automatisch bei Ablauf',
      category: 'Security'
    },
    {
      entity: 'UserRoleAssignment',
      retention: 'Unbegrenzt',
      deletion: 'Bei Rollen-Entzug',
      category: 'Permissions'
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Datenaufbewahrungsrichtlinien
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {policies.map((policy, idx) => (
            <div key={idx} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span className="font-medium">{policy.entity}</span>
                </div>
                <Badge variant="outline">{policy.category}</Badge>
              </div>
              <div className="text-sm space-y-1 ml-7">
                <div>
                  <span className="text-slate-600">Aufbewahrung: </span>
                  <span className="font-medium">{policy.retention}</span>
                </div>
                <div>
                  <span className="text-slate-600">Löschung: </span>
                  <span>{policy.deletion}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-blue-800">
          <strong>Hinweis:</strong> Diese Richtlinien entsprechen den Anforderungen der DSGVO 
          und können in der Funktion <code>cleanupOldData</code> konfiguriert werden.
        </div>
      </CardContent>
    </Card>
  );
}