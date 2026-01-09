import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Upload, Trash2, Download, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export default function ContractDocumentManager({ contractId }) {
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentName, setDocumentName] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const queryClient = useQueryClient();

  const { data: documents = [] } = useQuery({
    queryKey: ['contractDocuments', contractId],
    queryFn: () => base44.entities.Document.filter({ related_entity_id: contractId }),
    enabled: !!contractId
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.Document.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['contractDocuments', contractId] });
      toast.success('Dokument gelöscht');
    }
  });

  const handleUpload = async () => {
    if (!selectedFile || !documentName) {
      toast.error('Bitte Datei und Name angeben');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: selectedFile });
      
      await base44.entities.Document.create({
        name: documentName,
        file_url,
        file_type: selectedFile.type,
        file_size: selectedFile.size,
        related_entity_type: 'LeaseContract',
        related_entity_id: contractId,
        category: 'contract',
        created_at: new Date().toISOString()
      });

      queryClient.invalidateQueries({ queryKey: ['contractDocuments', contractId] });
      toast.success('Dokument hochgeladen');
      setShowUploadDialog(false);
      setDocumentName('');
      setSelectedFile(null);
    } catch (error) {
      toast.error('Upload fehlgeschlagen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Vertragsunterlagen
          </CardTitle>
          <Button size="sm" onClick={() => setShowUploadDialog(true)} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" />
            Hinzufügen
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-slate-600">Keine Dokumente vorhanden</p>
        ) : (
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-slate-50">
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">{doc.name}</p>
                    <p className="text-xs text-slate-500">
                      {new Date(doc.created_at).toLocaleDateString('de-DE')}
                      {doc.file_size && ` • ${(doc.file_size / 1024).toFixed(0)} KB`}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => window.open(doc.file_url, '_blank')}
                  >
                    <Download className="w-4 h-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => deleteMutation.mutate(doc.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Dokument hochladen</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Dokumentname</Label>
              <Input
                value={documentName}
                onChange={(e) => setDocumentName(e.target.value)}
                placeholder="z.B. Mietvertrag unterschrieben"
              />
            </div>
            <div>
              <Label>Datei</Label>
              <Input
                type="file"
                onChange={(e) => setSelectedFile(e.target.files[0])}
                accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
              />
            </div>
            <Button
              onClick={handleUpload}
              disabled={uploading}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Upload className="w-4 h-4 mr-2" />
              {uploading ? 'Lädt hoch...' : 'Hochladen'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}