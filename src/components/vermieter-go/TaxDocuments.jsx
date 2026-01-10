import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Receipt, Eye } from 'lucide-react';

export default function TaxDocuments({ buildingId }) {
  const { data: docs = [] } = useQuery({
    queryKey: ['taxDocs', buildingId],
    queryFn: () => base44.entities.Document.filter(
      { 
        category: 'Finanzen',
        ...(buildingId && { building_id: buildingId })
      },
      '-created_date',
      20
    )
  });

  const currentYear = new Date().getFullYear();
  const yearDocs = docs.filter(d => d.created_date?.startsWith(currentYear.toString()));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Receipt className="w-4 h-4" />
          Steuer-Dokumente {currentYear}
          <Badge>{yearDocs.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {yearDocs.slice(0, 5).map(doc => (
          <div key={doc.id} className="flex items-center justify-between p-2 bg-slate-50 rounded">
            <div className="flex-1">
              <p className="text-sm font-semibold">{doc.name}</p>
              <p className="text-xs text-slate-600">
                {new Date(doc.created_date).toLocaleDateString('de-DE')}
              </p>
            </div>
            <Eye className="w-4 h-4 text-slate-600" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}