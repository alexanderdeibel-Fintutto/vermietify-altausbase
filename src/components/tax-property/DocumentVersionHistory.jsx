import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { History, Download } from 'lucide-react';

export default function DocumentVersionHistory({ documentId }) {
  const { data: versions = [] } = useQuery({
    queryKey: ['documentVersions', documentId],
    queryFn: () => base44.entities.DocumentVersion.filter(
      { document_id: documentId },
      '-version_number',
      20
    ),
    enabled: !!documentId
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="w-5 h-5" />
          Versions-Historie
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {versions.length === 0 ? (
          <p className="text-sm text-slate-500 text-center py-4">Keine Versionen vorhanden</p>
        ) : (
          versions.map(version => (
            <div key={version.id} className="p-3 bg-slate-50 rounded-lg border border-slate-200">
              <div className="flex items-center justify-between mb-2">
                <div>
                  <div className="flex items-center gap-2">
                    <Badge>V{version.version_number}</Badge>
                    {version.is_current && <Badge className="bg-green-600">Aktuell</Badge>}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {new Date(version.created_date).toLocaleString('de-DE')}
                  </p>
                </div>
                <Button size="sm" variant="ghost" onClick={() => window.open(version.file_url, '_blank')}>
                  <Download className="w-4 h-4" />
                </Button>
              </div>
              {version.change_notes && (
                <p className="text-xs text-slate-600">{version.change_notes}</p>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}