import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Camera, Upload, X, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { base44 } from '@/api/base44Client';

export default function MobilePhotoUpload({ onUploadComplete, maxFiles = 5 }) {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const handleFileSelect = (event) => {
    const files = Array.from(event.target.files);
    if (files.length + selectedFiles.length > maxFiles) {
      toast.error(`Maximal ${maxFiles} Dateien erlaubt`);
      return;
    }

    const newFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36)
    }));

    setSelectedFiles([...selectedFiles, ...newFiles]);
  };

  const removeFile = (id) => {
    setSelectedFiles(selectedFiles.filter(f => f.id !== id));
  };

  const uploadFiles = async () => {
    setUploading(true);
    const uploadedUrls = [];

    try {
      for (const fileObj of selectedFiles) {
        const formData = new FormData();
        formData.append('file', fileObj.file);

        const response = await base44.integrations.Core.UploadFile({ file: fileObj.file });
        uploadedUrls.push(response.file_url);
      }

      toast.success('Dateien hochgeladen');
      if (onUploadComplete) {
        onUploadComplete(uploadedUrls);
      }
      setSelectedFiles([]);
    } catch (error) {
      toast.error('Upload fehlgeschlagen');
      console.error(error);
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="pt-6 space-y-4">
        {/* Upload Buttons */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            onClick={() => cameraInputRef.current?.click()}
            className="h-24 flex-col gap-2"
          >
            <Camera className="w-8 h-8" />
            <span className="text-sm">Foto aufnehmen</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            className="h-24 flex-col gap-2"
          >
            <Upload className="w-8 h-8" />
            <span className="text-sm">Galerie</span>
          </Button>
        </div>

        {/* Hidden Inputs */}
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*,application/pdf"
          multiple
          onChange={handleFileSelect}
          className="hidden"
        />

        {/* Preview Grid */}
        {selectedFiles.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600">{selectedFiles.length} Datei(en) ausgewählt</p>
              <Button
                size="sm"
                onClick={uploadFiles}
                disabled={uploading}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {uploading ? 'Wird hochgeladen...' : 'Hochladen'}
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {selectedFiles.map(fileObj => (
                <div key={fileObj.id} className="relative aspect-square">
                  {fileObj.file.type.startsWith('image/') ? (
                    <img
                      src={fileObj.preview}
                      alt="Preview"
                      className="w-full h-full object-cover rounded border border-slate-200"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 rounded border border-slate-200 flex items-center justify-center">
                      <ImageIcon className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                  <Button
                    size="icon"
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                    onClick={() => removeFile(fileObj.id)}
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-xs text-slate-500 text-center">
          Max. {maxFiles} Dateien • Fotos und PDFs erlaubt
        </p>
      </CardContent>
    </Card>
  );
}