import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { History, Download, RotateCcw, Upload, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';

export default function DocumentVersionManager({ documentId, companyId, documentName, documentUrl }) {
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [changeNotes, setChangeNotes] = useState('');
  const queryClient = useQueryClient();

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['document-versions', documentId],
    queryFn: async () => {
      const all = await base44.entities.DocumentVersion.filter({ document_id: documentId });
      return all.sort((a, b) => b.version_number - a.version_number);
    }
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Datei erforderlich');

      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          base44.functions.invoke('uploadDocumentVersion', {
            document_id: documentId,
            company_id: companyId,
            file: reader.result,
            change_notes: changeNotes
          }).then(resolve);
        };
        reader.readAsArrayBuffer(selectedFile);
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', documentId] });
      setUploadDialogOpen(false);
      setSelectedFile(null);
      setChangeNotes('');
    }
  });

  const revertMutation = useMutation({
    mutationFn: (version) =>
      base44.functions.invoke('revertDocumentVersion', {
        version_id: version.id,
        document_id: documentId,
        company_id: companyId
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', documentId] });
    }
  });

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-base">
          <History className="w-5 h-5" />
          Versionsverlauf
        </CardTitle>
        <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1">
              <Upload className="w-4 h-4" />
              Neue Version
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neue Dokumentversion hochladen</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Datei</label>
                <input
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg"
                />
                {selectedFile && (
                  <p className="text-xs text-slate-600">
                    {selectedFile.name} ({formatFileSize(selectedFile.size)})
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Änderungsnotizen</label>
                <Textarea
                  placeholder="Was hat sich geändert?"
                  value={changeNotes}
                  onChange={(e) => setChangeNotes(e.target.value)}
                  rows={3}
                />
              </div>

              <div className="flex gap-2 justify-end">
                <Button variant="outline" onClick={() => setUploadDialogOpen(false)}>
                  Abbrechen
                </Button>
                <Button
                  onClick={() => uploadMutation.mutate()}
                  disabled={uploadMutation.isPending || !selectedFile}
                >
                  Hochladen
                </Button>
              </div>

              {uploadMutation.isError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                  <p className="text-sm text-red-900">{uploadMutation.error.message}</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map(i => (
              <div key={i} className="h-16 bg-slate-200 rounded-lg animate-pulse" />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center py-8">
            <History className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-500">Keine Versionen</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {versions.map((version) => (
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
                        <Badge className="bg-green-100 text-green-700 text-xs flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          Aktuell
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {format(new Date(version.created_date), 'dd. MMM yyyy HH:mm', { locale: de })}
                      {' '}von {version.uploaded_by}
                    </p>
                    {version.change_notes && (
                      <p className="text-xs text-slate-600 mt-2 italic">
                        {version.change_notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-8 w-8"
                      onClick={() => window.open(version.file_url, '_blank')}
                      title="Herunterladen"
                    >
                      <Download className="w-3 h-3" />
                    </Button>
                    {!version.is_current && (
                      <Button
                        size="icon"
                        variant="outline"
                        className="h-8 w-8"
                        onClick={() => revertMutation.mutate(version)}
                        disabled={revertMutation.isPending}
                        title="Zu dieser Version zurückkehren"
                      >
                        <RotateCcw className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}