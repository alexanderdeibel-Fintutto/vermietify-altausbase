import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Archive, Lock, Download } from 'lucide-react';

export default function GoBDArchive() {
  const { data: archivedDocs = [] } = useQuery({
    queryKey: ['archivedDocs'],
    queryFn: () => base44.entities.Document.filter(
      { is_immutable: true },
      '-created_date',
      50
    )
  });

  const totalArchived = archivedDocs.length;
  const sizeInMB = archivedDocs.reduce((sum, d) => sum + ((d.file_size || 0) / (1024 * 1024)), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Archive className="w-5 h-5" />
          GoBD-Archiv
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-900">Dokumente</p>
            <p className="text-2xl font-bold text-green-900">{totalArchived}</p>
          </div>
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900">Speicherplatz</p>
            <p className="text-2xl font-bold text-blue-900">{sizeInMB.toFixed(0)} MB</p>
          </div>
        </div>

        <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
          <div className="flex items-center gap-2 mb-2">
            <Lock className="w-4 h-4 text-purple-600" />
            <p className="text-sm font-semibold text-purple-900">Revisionssicher</p>
          </div>
          <p className="text-xs text-slate-600">
            Alle Dokumente sind unveränderbar archiviert und entsprechen GoBD-Standards
          </p>
        </div>

        <Button variant="outline" className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Archiv exportieren
        </Button>
      </CardContent>
    </Card>
  );
}