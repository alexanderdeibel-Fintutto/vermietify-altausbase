import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle } from 'lucide-react';

export default function AuditPreparation() {
  const checklist = [
    { item: 'Alle Belege vorhanden', completed: true },
    { item: 'Kontoauszüge vollständig', completed: true },
    { item: 'Verträge archiviert', completed: true },
    { item: 'Buchungen plausibel', completed: false },
    { item: 'Reisekosten dokumentiert', completed: true },
    { item: 'AfA-Nachweise komplett', completed: false }
  ];

  const completedCount = checklist.filter(c => c.completed).length;
  const progress = (completedCount / checklist.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="w-5 h-5" />
          Betriebsprüfungs-Vorbereitung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between mb-2">
            <p className="text-sm font-semibold">Bereitschaft</p>
            <p className="text-sm">{completedCount}/{checklist.length}</p>
          </div>
          <Progress value={progress} />
        </div>

        <div className="space-y-2">
          {checklist.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 p-2 bg-slate-50 rounded">
              {item.completed ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400" />
              )}
              <span className={`text-sm ${item.completed ? 'text-slate-900' : 'text-slate-600'}`}>
                {item.item}
              </span>
            </div>
          ))}
        </div>

        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm font-semibold text-green-900">
            {progress >= 80 ? '✓ Gut vorbereitet' : '⚠️ Noch Arbeit nötig'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}