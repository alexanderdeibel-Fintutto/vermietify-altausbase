import React, { useState, useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Upload, File, Check, AlertCircle } from 'lucide-react';

export default function DocumentBatchUpload({ companyId, onComplete }) {
  const [files, setFiles] = useState([]);
  const [uploadProgress, setUploadProgress] = useState({});
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (filesToUpload) => {
      const uploadedFiles = [];
      
      for (let i = 0; i < filesToUpload.length; i++) {
        const file = filesToUpload[i];
        setUploadProgress(prev => ({ ...prev, [file.name]: 50 }));

        const result = await base44.integrations.Core.UploadFile({ file });
        uploadedFiles.push({
          name: file.name,
          url: result.file_url,
          size: file.size
        });

        setUploadProgress(prev => ({ ...prev, [file.name]: 100 }));
      }
      return uploadedFiles;
    },
    onSuccess: (uploadedFiles) => {
      queryClient.invalidateQueries({ queryKey: ['company-documents', companyId] });
      onComplete?.(uploadedFiles);
      setFiles([]);
      setUploadProgress({});
    }
  });

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    const droppedFiles = Array.from(e.dataTransfer.files);
    setFiles(prev => [...prev, ...droppedFiles]);
  }, []);

  const handleFileSelect = (e) => {
    const selectedFiles = Array.from(e.target.files || []);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeFile = (fileName) => {
    setFiles(prev => prev.filter(f => f.name !== fileName));
  };

  const handleUpload = () => {
    uploadMutation.mutate(files);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Mehrere Dokumente hochladen
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Drop Zone */}
          <label
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center cursor-pointer hover:border-slate-400 block transition-colors"
          >
            <input
              type="file"
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />
            <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
            <p className="text-sm text-slate-600">
              Dateien hierher ziehen oder klicken zum Auswählen
            </p>
          </label>

          {/* File List */}
          {files.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium text-slate-900">
                {files.length} Datei(en) zum Upload bereit
              </h3>
              {files.map(file => (
                <div key={file.name} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2 min-w-0">
                    <File className="w-4 h-4 text-slate-400 flex-shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm text-slate-900 truncate">{file.name}</p>
                      <p className="text-xs text-slate-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  {uploadProgress[file.name] ? (
                    <div className="flex items-center gap-2">
                      <Progress value={uploadProgress[file.name]} className="w-16" />
                      <span className="text-xs text-slate-500">{uploadProgress[file.name]}%</span>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => removeFile(file.name)}
                    >
                      ✕
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}

          {uploadMutation.isPending && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900">
                Uploading {files.filter(f => uploadProgress[f.name] === 100).length} von {files.length} Dateien...
              </p>
            </div>
          )}

          {uploadMutation.isSuccess && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-900">
                {uploadMutation.data.length} Datei(en) erfolgreich hochgeladen
              </p>
            </div>
          )}

          {uploadMutation.isError && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-900">Fehler beim Upload</p>
            </div>
          )}

          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploadMutation.isPending}
            className="w-full"
          >
            {uploadMutation.isPending ? 'Wird hochgeladen...' : `${files.length} Datei(en) hochladen`}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}