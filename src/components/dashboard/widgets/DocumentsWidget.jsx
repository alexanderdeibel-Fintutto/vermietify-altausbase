import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentsWidget() {
  const { data: documents = [] } = useQuery({
    queryKey: ['documents-widget'],
    queryFn: () => base44.entities.Document.list('-created_date', 5)
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Letzte Dokumente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {documents.map(doc => (
            <div key={doc.id} className="p-2 border rounded">
              <p className="text-sm font-semibold truncate">{doc.name}</p>
              <p className="text-xs text-slate-600">{format(new Date(doc.created_date), 'dd.MM.yyyy')}</p>
            </div>
          ))}
          {documents.length === 0 && (
            <p className="text-sm text-slate-500 text-center py-4">Keine Dokumente</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}