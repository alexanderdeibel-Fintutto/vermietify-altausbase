import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, ExternalLink } from 'lucide-react';

export default function LegalUpdates() {
  const updates = [
    { id: 1, title: 'Mietpreisbremse Update', date: '2026-01-05', category: 'Mietrecht', new: true },
    { id: 2, title: 'CO2-Abgabe Änderung', date: '2026-01-03', category: 'Energierecht', new: true },
    { id: 3, title: 'Betriebskosten-VO', date: '2025-12-20', category: 'Nebenkosten', new: false }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Scale className="w-4 h-4" />
          Gesetzesänderungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {updates.map(update => (
          <div key={update.id} className="p-2 bg-slate-50 rounded">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{update.title}</p>
                  {update.new && <Badge className="bg-red-600 text-xs">NEU</Badge>}
                </div>
                <p className="text-xs text-slate-600 mt-1">{update.category} • {update.date}</p>
              </div>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}