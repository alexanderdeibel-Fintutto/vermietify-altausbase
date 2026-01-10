import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tantml:react-query';
import { base44 } from '@/api/base44Client';
import { Clock, AlertCircle } from 'lucide-react';

export default function RetentionTracker() {
  const { data: documents = [] } = useQuery({
    queryKey: ['documentsWithRetention'],
    queryFn: () => base44.entities.Document.filter(
      { retention_until: { $exists: true } },
      'retention_until',
      100
    )
  });

  const canDelete = documents.filter(d => new Date(d.retention_until) < new Date());
  const mustKeep = documents.filter(d => new Date(d.retention_until) >= new Date());

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="w-5 h-5" />
          Aufbewahrungsfristen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-orange-50 rounded-lg">
            <p className="text-xs text-orange-900">Aufbewahren</p>
            <p className="text-2xl font-bold text-orange-900">{mustKeep.length}</p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-900">Löschbar</p>
            <p className="text-2xl font-bold text-green-900">{canDelete.length}</p>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Nächste ablaufende Fristen:</p>
          {mustKeep.slice(0, 4).map(doc => {
            const days = Math.floor((new Date(doc.retention_until) - new Date()) / (1000 * 60 * 60 * 24));
            return (
              <div key={doc.id} className="flex justify-between p-2 bg-slate-50 rounded">
                <span className="text-sm">{doc.name?.slice(0, 30)}</span>
                <Badge variant="outline">{days} Tage</Badge>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}