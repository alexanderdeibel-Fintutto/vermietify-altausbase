import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Clock, Download, RotateCcw, FileText } from 'lucide-react';

export default function DocumentVersionTimeline({ documentId }) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const all = await base44.entities.DocumentVersion.filter({ document_id: documentId });
      return all.sort((a, b) => b.version_number - a.version_number);
    }
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return <div className="space-y-2 animate-pulse">{[1, 2].map(i => <div key={i} className="h-20 bg-slate-200 rounded" />)}</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Clock className="w-5 h-5" />
          Versionsverlauf ({versions.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {versions.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Keine Versionen vorhanden</p>
          </div>
        ) : (
          <div className="space-y-3">
            {versions.map((version, idx) => (
              <div
                key={version.id}
                className={`p-4 rounded-lg border transition-all ${
                  version.is_current 
                    ? 'bg-green-50 border-green-200' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-semibold text-sm text-slate-900">
                        Version {version.version_number}
                      </h4>
                      {version.is_current && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Aktuelle Version</Badge>
                      )}
                    </div>

                    <p className="text-xs text-slate-600">
                      {format(new Date(version.created_date), 'dd. MMMM yyyy HH:mm:ss', { locale: de })}
                    </p>
                    
                    <p className="text-xs text-slate-600 mt-1">
                      Hochgeladen von: <span className="font-medium">{version.uploaded_by}</span>
                    </p>

                    <p className="text-xs text-slate-600">
                      Dateigröße: <span className="font-medium">{formatFileSize(version.file_size)}</span>
                    </p>

                    {version.change_notes && (
                      <p className="text-xs text-slate-700 mt-2 italic border-l-2 border-slate-300 pl-2">
                        "{version.change_notes}"
                      </p>
                    )}
                  </div>

                  {!version.is_current && (
                    <div className="flex gap-1 flex-shrink-0">
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => window.open(version.file_url, '_blank')}
                        title="Herunterladen"
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8 text-orange-600 hover:text-orange-700"
                        title="Auf diese Version zurücksetzen"
                      >
                        <RotateCcw className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                </div>

                {version.is_current && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="mt-3 w-full"
                    onClick={() => window.open(version.file_url, '_blank')}
                  >
                    <Download className="w-3 h-3 mr-1" />
                    Aktuelle Version herunterladen
                  </Button>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}