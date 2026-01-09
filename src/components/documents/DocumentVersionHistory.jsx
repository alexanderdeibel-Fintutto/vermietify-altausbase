import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { History, Download, Eye, CheckCircle, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function DocumentVersionHistory({ documentId, onClose }) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [changeNotes, setChangeNotes] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const queryClient = useQueryClient();

  const { data: document } = useQuery({
    queryKey: ['document', documentId],
    queryFn: () => base44.entities.Document.filter({ id: documentId }, null, 1).then(d => d[0])
  });

  const { data: versions = [] } = useQuery({
    queryKey: ['documentVersions', documentId],
    queryFn: () => base44.entities.DocumentVersion.filter({ document_id: documentId }, '-version_number', 50)
  });

  const createVersionMutation = useMutation({
    mutationFn: async () => {
      if (!selectedFile) throw new Error('Keine Datei ausgewählt');
      
      const user = await base44.auth.me();
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      const nextVersion = versions.length > 0 ? Math.max(...versions.map(v => v.version_number)) + 1 : 1;
      
      return await base44.entities.DocumentVersion.create({
        document_id: documentId,
        version_number: nextVersion,
        file_url,
        change_notes: changeNotes,
        modified_by: user.email,
        is_current: false,
        created_at: new Date().toISOString()
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentVersions', documentId] });
      toast.success('Neue Version erstellt');
      setShowUploadDialog(false);
      setChangeNotes('');
      setSelectedFile(null);
    }
  });

  const setAsCurrentMutation = useMutation({
    mutationFn: async (versionId) => {
      // Set all versions to not current
      await Promise.all(
        versions.map(v => 
          base44.entities.DocumentVersion.update(v.id, { is_current: false })
        )
      );
      // Set selected as current
      return await base44.entities.DocumentVersion.update(versionId, { is_current: true });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['documentVersions', documentId] });
      toast.success('Version als aktuell markiert');
    }
  });

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="w-5 h-5" />
            Versionsverlauf: {document?.title}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <Button onClick={() => setShowUploadDialog(true)} className="w-full">
            <Upload className="w-4 h-4 mr-2" />
            Neue Version hochladen
          </Button>

          <div className="space-y-3 max-h-96 overflow-y-auto">
            {versions.map(version => (
              <Card key={version.id} className={version.is_current ? 'border-blue-500' : ''}>
                <CardContent className="pt-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge>Version {version.version_number}</Badge>
                        {version.is_current && (
                          <Badge className="bg-blue-600">Aktuell</Badge>
                        )}
                      </div>
                      <p className="text-sm text-slate-600 mb-2">{version.change_notes}</p>
                      <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>Von: {version.modified_by}</span>
                        <span>{new Date(version.created_at).toLocaleString('de-DE')}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {!version.is_current && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setAsCurrentMutation.mutate(version.id)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Als aktuell
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => window.open(version.file_url, '_blank')}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          const a = document.createElement('a');
                          a.href = version.file_url;
                          a.download = `${document.title}_v${version.version_number}.pdf`;
                          a.click();
                        }}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {showUploadDialog && (
          <Dialog open={true} onOpenChange={() => setShowUploadDialog(false)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Neue Version hochladen</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Datei</label>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="w-full"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Änderungsnotizen</label>
                  <Textarea
                    value={changeNotes}
                    onChange={(e) => setChangeNotes(e.target.value)}
                    placeholder="Was wurde geändert?"
                    className="min-h-24"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowUploadDialog(false)}>
                    Abbrechen
                  </Button>
                  <Button
                    onClick={() => createVersionMutation.mutate()}
                    disabled={!selectedFile || createVersionMutation.isPending}
                  >
                    Version erstellen
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </DialogContent>
    </Dialog>
  );
}