import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock } from 'lucide-react';

export default function DocumentVersionTimeline({ documentId }) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['document-versions-timeline', documentId],
    queryFn: async () => {
      const all = await base44.entities.DocumentVersion.filter({ document_id: documentId });
      return all.sort((a, b) => new Date(a.created_date) - new Date(b.created_date));
    }
  });

  if (isLoading) return <div className="h-32 bg-slate-200 rounded-lg animate-pulse" />;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-5 h-5" />
          Versions-Timeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-200" />

          {/* Timeline events */}
          <div className="space-y-4">
            {versions.map((version, idx) => (
              <div key={version.id} className="flex gap-4">
                {/* Dot */}
                <div className="relative z-10 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    version.is_current ? 'bg-green-500' : 'bg-slate-400'
                  }`} />
                </div>

                {/* Content */}
                <div className="pb-4">
                  <p className="text-sm font-medium text-slate-900">
                    Version {version.version_number}
                  </p>
                  <p className="text-xs text-slate-600">
                    {format(new Date(version.created_date), 'dd. MMM yyyy HH:mm', { locale: de })}
                  </p>
                  {version.change_notes && (
                    <p className="text-xs text-slate-600 mt-1 italic">
                      {version.change_notes}
                    </p>
                  )}
                  <p className="text-xs text-slate-500 mt-1">
                    von {version.uploaded_by}
                  </p>
                  {version.is_current && (
                    <Badge className="mt-2 bg-green-100 text-green-700 text-xs">
                      Aktuelle Version
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}