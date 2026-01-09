import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Upload, FileUp } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export default function ManualUploadDialog({ open, onOpenChange, onSuccess }) {
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Upload to storage
        const uploadResponse = await base44.integrations.Core.UploadFile({
          file: file
        });

        // Create DocumentInbox entry
        await base44.entities.DocumentInbox.create({
          status: 'processing',
          source_type: 'manual_upload',
          original_filename: file.name,
          original_file_size: file.size,
          original_pdf_url: uploadResponse.file_url,
          document_type: 'unknown'
        });

        setUploadProgress(((i + 1) / files.length) * 100);
      }

      setFiles([]);
      setUploadProgress(0);
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error('Upload error:', error);
      alert('Fehler beim Hochladen: ' + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>📄 Dokument hochladen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center">
            <FileUp className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm text-slate-600 mb-3">
              Ziehe PDFs hierher oder klicke zum Auswählen
            </p>
            <Input
              type="file"
              multiple
              accept=".pdf,.jpg,.jpeg,.png"
              onChange={handleFileSelect}
              className="cursor-pointer"
              disabled={uploading}
            />
          </div>

          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{files.length} Datei(en) ausgewählt:</p>
              <ul className="space-y-1 max-h-40 overflow-auto">
                {files.map((file, idx) => (
                  <li key={idx} className="text-sm text-slate-600">
                    • {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </li>
                ))}
              </ul>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFiles([])}
                disabled={uploading}
              >
                Zurücksetzen
              </Button>
            </div>
          )}

          {uploading && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Wird hochgeladen...</p>
              <Progress value={uploadProgress} className="h-2" />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={uploading}
          >
            Abbrechen
          </Button>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
            className="gap-2"
          >
            <Upload className="w-4 h-4" />
            {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}