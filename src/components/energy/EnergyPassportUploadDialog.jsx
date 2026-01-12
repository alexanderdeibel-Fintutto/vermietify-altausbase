import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Upload, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function EnergyPassportUploadDialog({ open, onClose, buildingId }) {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (file) => {
      setUploading(true);

      // Upload file first
      const uploadResponse = await base44.integrations.Core.UploadFile({ file });
      const fileUrl = uploadResponse.file_url;

      // Extract data from PDF
      const extractResponse = await base44.functions.invoke('extractEnergyPassportData', {
        file_url: fileUrl,
        building_id: buildingId
      });

      return extractResponse.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['energyPassports', buildingId]);
      toast.success('Energieausweis erfolgreich hochgeladen und analysiert');
      setFile(null);
      setUploading(false);
      onClose();
    },
    onError: (error) => {
      toast.error('Fehler beim Upload: ' + error.message);
      setUploading(false);
    }
  });

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/pdf') {
        toast.error('Bitte nur PDF-Dateien hochladen');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleUpload = () => {
    if (file) {
      uploadMutation.mutate(file);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Energieausweis hochladen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label>PDF-Datei auswählen</Label>
            <div className="mt-2">
              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                {file ? (
                  <div className="flex flex-col items-center">
                    <FileText className="w-8 h-8 text-blue-600 mb-2" />
                    <p className="text-sm text-slate-700">{file.name}</p>
                    <p className="text-xs text-slate-500">{(file.size / 1024).toFixed(0)} KB</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Upload className="w-8 h-8 text-slate-400 mb-2" />
                    <p className="text-sm text-slate-600">PDF auswählen</p>
                    <p className="text-xs text-slate-500">Klicken zum Hochladen</p>
                  </div>
                )}
                <input
                  type="file"
                  className="hidden"
                  accept="application/pdf"
                  onChange={handleFileChange}
                  disabled={uploading}
                />
              </label>
            </div>
          </div>

          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={onClose} disabled={uploading}>
              Abbrechen
            </Button>
            <Button 
              onClick={handleUpload}
              disabled={!file || uploading}
            >
              {uploading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {uploading ? 'Analysiere...' : 'Hochladen & Analysieren'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}