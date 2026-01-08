import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DocumentsWidget() {
  const { data: documents = [] } = useQuery({
    queryKey: ['documents'],
    queryFn: () => base44.entities.Document.list('-created_date', 5)
  });

  return (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div key={doc.id} className="flex items-center gap-2 text-sm p-2 rounded hover:bg-slate-50">
          <FileText className="w-4 h-4 text-blue-600" />
          <div className="flex-1 min-w-0">
            <div className="font-medium truncate">{doc.title || doc.file_name}</div>
            <div className="text-xs text-slate-600">
              {format(parseISO(doc.created_date), 'dd.MM.yyyy', { locale: de })}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}