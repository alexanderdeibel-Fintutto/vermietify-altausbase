import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Upload, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function DocumentVersionUploader({ documentId }) {
  const [isOpen, setIsOpen] = useState(false);
  const [file, setFile] = useState(null);
  const [changeNotes, setChangeNotes] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error('Keine Datei ausgewählt');

      // Upload file
      const uploadRes = await base44.integrations.Core.UploadFile({ file });
      
      // Create version
      return base44.functions.invoke('uploadDocumentVersion', {
        document_id: documentId,
        file_url: uploadRes.file_url,
        file_name: file.name,
        file_size: file.size,
        change_notes: changeNotes || 'Neue Version hochgeladen'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['document-versions', documentId] });
      setFile(null);
      setChangeNotes('');
      setIsOpen(false);
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Upload className="w-4 h-4" />
          Neue Version hochladen
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Neue Dokumentversion</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* File Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Datei</label>
            <label className="flex items-center justify-center w-full p-6 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer hover:border-slate-400">
              <div className="text-center">
                {file ? (
                  <>
                    <FileText className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                    <p className="text-sm font-medium text-slate-900">{file.name}</p>
                    <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(2)} KB</p>
                  </>
                ) : (
                  <>
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">Datei auswählen oder hierher ziehen</p>
                  </>
                )}
              </div>
              <input
                type="file"
                className="hidden"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.xlsx,.xls,.ppt,.pptx"
              />
            </label>
          </div>

          {/* Change Notes */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Änderungsnotizen</label>
            <Textarea
              placeholder="Was hat sich in dieser Version geändert?"
              value={changeNotes}
              onChange={(e) => setChangeNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Error */}
          {uploadMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-900">{uploadMutation.error.message}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={uploadMutation.isPending}
            >
              Abbrechen
            </Button>
            <Button
              onClick={() => uploadMutation.mutate()}
              disabled={!file || uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Wird hochgeladen...' : 'Version erstellen'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}