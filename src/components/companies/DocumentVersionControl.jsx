import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { History, Download, Eye, Trash2, RotateCcw } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function DocumentVersionControl({ documentId, fileName }) {
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const { data: versions = [] } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const allVersions = await base44.entities.DocumentVersion.filter({ document_id: documentId });
      return allVersions.sort((a, b) => b.version_number - a.version_number);
    }
  });

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="w-5 h-5" />
          Versionsverlauf ({fileName})
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {versions.length === 0 ? (
            <p className="text-center text-slate-500 text-sm py-8">Keine Versionen vorhanden</p>
          ) : (
            versions.map(version => (
              <div
                key={version.id}
                className={`p-3 rounded-lg border transition-colors ${
                  version.is_current ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-200'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-sm text-slate-900">
                        Version {version.version_number}
                      </h4>
                      {version.is_current && (
                        <Badge className="bg-green-100 text-green-700 text-xs">Aktuelle</Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {format(new Date(version.created_date), 'dd. MMM yyyy HH:mm', { locale: de })}
                    </p>
                    <p className="text-xs text-slate-500">Größe: {formatFileSize(version.file_size)}</p>
                    {version.change_notes && (
                      <p className="text-xs text-slate-600 mt-1 italic">
                        Notizen: {version.change_notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => setPreviewUrl(version.file_url)}
                      title="Vorschau"
                    >
                      <Eye className="w-3 h-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => window.open(version.file_url, '_blank')}
                      title="Herunterladen"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Preview Modal */}
        {previewUrl && (
          <Dialog open={!!previewUrl} onOpenChange={() => setPreviewUrl(null)}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>Dokumentvorschau</DialogTitle>
              </DialogHeader>
              <div className="w-full h-96 rounded-lg overflow-hidden bg-slate-100">
                {previewUrl.endsWith('.pdf') ? (
                  <iframe src={previewUrl} className="w-full h-full" />
                ) : (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                )}
              </div>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}