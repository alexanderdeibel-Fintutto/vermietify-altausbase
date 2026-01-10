import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download, Eye } from 'lucide-react';

export default function FloorPlanAccess({ buildingId }) {
  const { data: documents = [] } = useQuery({
    queryKey: ['floorPlans', buildingId],
    queryFn: () => base44.entities.Document.filter(
      buildingId 
        ? { 
            building_id: buildingId,
            category: 'Verwaltung',
            name: { $regex: 'Grundriss|Plan' }
          }
        : { 
            category: 'Verwaltung',
            name: { $regex: 'Grundriss|Plan' }
          },
      '-created_date',
      20
    )
  });

  const samplePlans = [
    { id: 1, name: 'Erdgeschoss', type: 'PDF' },
    { id: 2, name: 'Obergeschoss 1', type: 'PDF' },
    { id: 3, name: 'Keller', type: 'PDF' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Gebäudepläne
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {samplePlans.map(plan => (
          <div key={plan.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="font-semibold text-sm">{plan.name}</p>
                <p className="text-xs text-slate-600">{plan.type}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1">
                <Eye className="w-3 h-3 mr-1" />
                Ansehen
              </Button>
              <Button size="sm" variant="outline" className="flex-1">
                <Download className="w-3 h-3 mr-1" />
                Download
              </Button>
            </div>
          </div>
        ))}
        
        {documents.length === 0 && samplePlans.length === 0 && (
          <p className="text-center text-slate-600 py-4">Keine Pläne verfügbar</p>
        )}
      </CardContent>
    </Card>
  );
}