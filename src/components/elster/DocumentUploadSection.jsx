import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, File, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';

export default function DocumentUploadSection({ submissionId, documents = [], onUploadComplete }) {
  const [uploading, setUploading] = useState(false);
  const [documentType, setDocumentType] = useState('');

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !documentType) {
      toast.error('Bitte Dokumenttyp auswählen');
      return;
    }

    setUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result.split(',')[1];
        
        const response = await base44.functions.invoke('uploadDocumentForSubmission', {
          submission_id: submissionId,
          file: base64,
          document_type: documentType
        });

        if (response.data.success) {
          toast.success('Dokument hochgeladen');
          if (response.data.extracted_data) {
            toast.info('Daten automatisch extrahiert');
          }
          onUploadComplete?.();
          setDocumentType('');
          e.target.value = '';
        }
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error('Upload fehlgeschlagen');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dokumente</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Dokumenttyp</Label>
            <Select value={documentType} onValueChange={setDocumentType}>
              <SelectTrigger>
                <SelectValue placeholder="Typ wählen..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="receipt">Beleg</SelectItem>
                <SelectItem value="invoice">Rechnung</SelectItem>
                <SelectItem value="contract">Vertrag</SelectItem>
                <SelectItem value="tax_certificate">Steuerbescheinigung</SelectItem>
                <SelectItem value="other">Sonstiges</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Datei hochladen</Label>
            <div className="flex gap-2">
              <input
                type="file"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileUpload}
                disabled={uploading || !documentType}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="flex-1">
                <Button
                  variant="outline"
                  disabled={uploading || !documentType}
                  className="w-full"
                  asChild
                >
                  <span>
                    {uploading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Upload className="w-4 h-4 mr-2" />
                    )}
                    Hochladen
                  </span>
                </Button>
              </label>
            </div>
          </div>
        </div>

        {documents.length > 0 && (
          <div className="space-y-2">
            <div className="text-sm font-medium">Hochgeladene Dokumente:</div>
            {documents.map((doc, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 border rounded">
                <div className="flex items-center gap-2">
                  <File className="w-4 h-4 text-slate-500" />
                  <span className="text-sm">{doc.type}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-slate-500">
                    {new Date(doc.uploaded_at).toLocaleDateString('de-DE')}
                  </span>
                  <CheckCircle className="w-4 h-4 text-green-600" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}