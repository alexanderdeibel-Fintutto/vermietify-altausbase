import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Upload, Download, Trash2, Eye, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

export default function TenantDocumentsTab({ tenantId }) {
  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [documentData, setDocumentData] = useState({
    dokumenttyp: 'Sonstige',
    titel: '',
    file: null
  });

  const queryClient = useQueryClient();

  const { data: documents = [], isLoading } = useQuery({
    queryKey: ['tenant-documents', tenantId],
    queryFn: () => base44.entities.UploadedDocument.filter({ tenant_id: tenantId }, '-created_date', 100)
  });

  const deleteMutation = useMutation({
    mutationFn: (docId) => base44.entities.UploadedDocument.delete(docId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tenant-documents', tenantId]);
      toast.success('Dokument gelöscht');
    }
  });

  const handleUpload = async () => {
    if (!documentData.file || !documentData.titel) {
      toast.error('Titel und Datei sind erforderlich');
      return;
    }

    setUploading(true);
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file: documentData.file });
      
      await base44.entities.UploadedDocument.create({
        tenant_id: tenantId,
        dokumenttyp: documentData.dokumenttyp,
        titel: documentData.titel,
        datei_url: file_url,
        dateiname: documentData.file.name,
        dateigroesse: documentData.file.size,
        mime_type: documentData.file.type
      });

      queryClient.invalidateQueries(['tenant-documents', tenantId]);
      toast.success('Dokument hochgeladen');
      setUploadOpen(false);
      setDocumentData({ dokumenttyp: 'Sonstige', titel: '', file: null });
    } catch (error) {
      toast.error('Upload fehlgeschlagen');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  const documentTypes = {
    'SCHUFA-Auskunft': 'bg-blue-100 text-blue-700',
    'Einkommensnachweis': 'bg-emerald-100 text-emerald-700',
    'Ausweiskopie': 'bg-purple-100 text-purple-700',
    'Mietbürgschaft': 'bg-amber-100 text-amber-700',
    'SEPA-Mandat': 'bg-indigo-100 text-indigo-700',
    'Sonstige': 'bg-slate-100 text-slate-700'
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium text-slate-900">Dokumente ({documents.length})</h3>
        <Button size="sm" onClick={() => setUploadOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Upload className="w-4 h-4 mr-2" />
          Hochladen
        </Button>
      </div>

      {isLoading ? (
        <Card>
          <CardContent className="py-8 text-center text-slate-500">
            Lade Dokumente...
          </CardContent>
        </Card>
      ) : documents.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <FileText className="w-12 h-12 text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500 mb-3">Keine Dokumente vorhanden</p>
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Erstes Dokument hochladen
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {documents.map(doc => (
            <Card key={doc.id} className="hover:border-slate-300 transition-colors">
              <CardContent className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-8 h-8 text-slate-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-slate-900">{doc.titel}</p>
                        <Badge className={documentTypes[doc.dokumenttyp] || 'bg-slate-100 text-slate-700'}>
                          {doc.dokumenttyp}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1">
                        <span>{doc.dateiname}</span>
                        <span>{(doc.dateigroesse / 1024).toFixed(0)} KB</span>
                        <span>{format(new Date(doc.created_date), 'dd.MM.yyyy', { locale: de })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => window.open(doc.datei_url, '_blank')}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Öffnen
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        const a = document.createElement('a');
                        a.href = doc.datei_url;
                        a.download = doc.dateiname;
                        a.click();
                      }}
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => deleteMutation.mutate(doc.id)}
                      className="text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Upload Dialog */}
      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Dokument hochladen</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Dokumenttyp *</Label>
              <Select 
                value={documentData.dokumenttyp} 
                onValueChange={v => setDocumentData({...documentData, dokumenttyp: v})}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SCHUFA-Auskunft">SCHUFA-Auskunft</SelectItem>
                  <SelectItem value="Einkommensnachweis">Einkommensnachweis</SelectItem>
                  <SelectItem value="Ausweiskopie">Ausweiskopie</SelectItem>
                  <SelectItem value="Mietbürgschaft">Mietbürgschaft</SelectItem>
                  <SelectItem value="SEPA-Mandat">SEPA-Mandat</SelectItem>
                  <SelectItem value="Sonstige">Sonstige</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Titel *</Label>
              <Input
                value={documentData.titel}
                onChange={e => setDocumentData({...documentData, titel: e.target.value})}
                placeholder="z.B. SCHUFA vom 12.01.2026"
              />
            </div>

            <div>
              <Label>Datei auswählen *</Label>
              <Input
                type="file"
                onChange={e => setDocumentData({...documentData, file: e.target.files[0]})}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              {documentData.file && (
                <p className="text-xs text-slate-500 mt-1">
                  {documentData.file.name} ({(documentData.file.size / 1024).toFixed(0)} KB)
                </p>
              )}
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <Button type="button" variant="outline" onClick={() => setUploadOpen(false)}>
                Abbrechen
              </Button>
              <Button 
                type="button" 
                onClick={handleUpload}
                disabled={uploading || !documentData.file || !documentData.titel}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Hochladen
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
}