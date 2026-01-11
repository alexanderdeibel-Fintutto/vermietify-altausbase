import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Upload, Loader2, CheckCircle2 } from 'lucide-react';

export default function MobileDocumentScanner({ companyId }) {
  const [preview, setPreview] = useState(null);
  const [scanResult, setScanResult] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: (imageFile) =>
      base44.functions.invoke('mobileDocumentScanner', {
        company_id: companyId,
        image_file: imageFile
      }),
    onSuccess: (result) => {
      setScanResult(result.data);
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    }
  });

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setPreview(event.target.result);
      scanMutation.mutate(file);
    };
    reader.readAsDataURL(file);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Camera className="w-4 h-4" />
          Mobile Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileSelect}
          className="hidden"
        />

        {!preview && (
          <Button
            onClick={() => fileInputRef.current?.click()}
            className="w-full gap-2"
          >
            <Camera className="w-4 h-4" />
            Dokument fotografieren
          </Button>
        )}

        {preview && (
          <div className="space-y-3">
            <img src={preview} alt="Preview" className="w-full rounded-lg border" />

            {scanMutation.isPending && (
              <div className="flex items-center justify-center gap-2 text-sm text-slate-600">
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysiere Dokument...
              </div>
            )}

            {scanResult && (
              <div className="bg-green-50 p-3 rounded space-y-2">
                <div className="flex items-center gap-2 text-green-700">
                  <CheckCircle2 className="w-4 h-4" />
                  <span className="text-sm font-medium">Erfolgreich gescannt!</span>
                </div>
                <p className="text-xs text-slate-700">
                  <strong>Typ:</strong> {scanResult.ocr_result?.document_type}
                </p>
                <p className="text-xs text-slate-700 line-clamp-3">
                  {scanResult.ocr_result?.text?.substring(0, 150)}...
                </p>
              </div>
            )}

            <Button
              variant="outline"
              onClick={() => {
                setPreview(null);
                setScanResult(null);
              }}
              className="w-full"
            >
              Neuer Scan
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}