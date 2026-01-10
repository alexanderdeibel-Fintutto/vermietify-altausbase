import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { History, RotateCcw } from 'lucide-react';
import { format } from 'date-fns';

export default function DocumentVersionViewer({ documentId }) {
  const [selectedVersion, setSelectedVersion] = useState(null);

  const { data: document } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => base44.asServiceRole.entities.Document.read(documentId)
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const result = await base44.asServiceRole.entities.DocumentVersion.filter({
        document_id: documentId
      }, '-version_number');
      return result;
    }
  });

  const rollbackMutation = useMutation({
    mutationFn: (version_number) =>
      base44.functions.invoke('documentVersionControl', {
        document_id: documentId,
        action: 'rollback',
        new_content: version_number.toString()
      })
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm flex items-center gap-2">
          <History className="w-4 h-4" />
          Versionsverlauf
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {versions.map((version, idx) => (
          <div
            key={version.id}
            onClick={() => setSelectedVersion(version)}
            className={`p-3 border rounded cursor-pointer transition ${
              selectedVersion?.id === version.id ? 'bg-blue-50 border-blue-300' : 'hover:bg-slate-50'
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">v{version.version_number}</p>
                <p className="text-xs text-slate-600">
                  {format(new Date(version.created_date), 'dd.MM.yyyy HH:mm')}
                </p>
                {version.change_notes && (
                  <p className="text-xs text-slate-700 mt-1">{version.change_notes}</p>
                )}
              </div>
              {idx > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    rollbackMutation.mutate(version.version_number);
                  }}
                  disabled={rollbackMutation.isPending}
                  className="gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  Wiederherstellen
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}