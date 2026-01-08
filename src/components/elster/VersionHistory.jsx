import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { History, Eye, GitBranch } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function VersionHistory({ submissionId }) {
  const [selectedVersion, setSelectedVersion] = useState(null);

  const { data: versions = [] } = useQuery({
    queryKey: ['submission-versions', submissionId],
    queryFn: async () => {
      const logs = await base44.entities.ActivityLog.filter({
        entity_type: 'ElsterSubmission',
        entity_id: submissionId,
        action: 'version_created'
      });
      return logs.sort((a, b) => 
        (b.metadata?.version_number || 0) - (a.metadata?.version_number || 0)
      );
    },
    enabled: !!submissionId
  });

  if (versions.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Versionshistorie
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 text-center py-4">Keine Versionen gespeichert</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <History className="w-4 h-4" />
            Versionshistorie ({versions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {versions.map((version) => (
              <div key={version.id} className="flex items-center justify-between p-3 border rounded hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <GitBranch className="w-4 h-4 text-slate-400" />
                  <div>
                    <div className="font-medium text-sm">
                      Version {version.metadata?.version_number || 1}
                    </div>
                    <div className="text-xs text-slate-600">
                      {new Date(version.created_date).toLocaleString('de-DE')}
                      {version.created_by && ` • ${version.created_by}`}
                    </div>
                    {version.metadata?.notes && (
                      <div className="text-xs text-slate-500 mt-1">{version.metadata.notes}</div>
                    )}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedVersion(version)}
                >
                  <Eye className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {selectedVersion && (
        <Dialog open={!!selectedVersion} onOpenChange={() => setSelectedVersion(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Version {selectedVersion.metadata?.version_number || 1}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex gap-2">
                <Badge>{selectedVersion.changes?.status}</Badge>
                {selectedVersion.changes?.ai_confidence_score && (
                  <Badge variant="outline">
                    KI: {selectedVersion.changes.ai_confidence_score}%
                  </Badge>
                )}
              </div>
              <div>
                <div className="text-sm font-medium mb-2">Formulardaten:</div>
                <div className="bg-slate-50 rounded p-3 text-xs space-y-1 max-h-64 overflow-y-auto">
                  {selectedVersion.changes?.form_data && 
                    Object.entries(selectedVersion.changes.form_data).map(([key, value]) => (
                      <div key={key} className="flex justify-between">
                        <span className="text-slate-600">{key}:</span>
                        <span className="font-medium">{String(value)}</span>
                      </div>
                    ))
                  }
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}