import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Camera, Scan, CheckCircle, Upload, X } from 'lucide-react';
import { toast } from 'sonner';
import MeterImageAnnotation from './MeterImageAnnotation';

export default function MobileMeterScanner({ buildingId, onComplete }) {
  const [capturedImage, setCapturedImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [manualEdit, setManualEdit] = useState(false);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async (imageUrl) => {
      const response = await base44.functions.invoke('scanMeterReading', {
        image_url: imageUrl,
        building_id: buildingId
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setAnalyzing(false);
      if (data.confidence >= 0.7) {
        toast.success('Zähler erfolgreich erkannt!');
      } else {
        toast.warning('Bitte überprüfen Sie die erkannten Daten');
      }
    },
    onError: () => {
      setAnalyzing(false);
      toast.error('Fehler bei der Erkennung');
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('saveMeterReading', {
        meter_id: data.meter_id,
        reading_value: data.reading_value,
        reading_date: data.reading_date,
        image_url: capturedImage,
        auto_detected: !manualEdit
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['meters'] });
      toast.success('Zählerstand gespeichert');
      resetScanner();
      if (onComplete) onComplete();
    }
  });

  const handleCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    
    try {
      // Upload image
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCapturedImage(file_url);
      
      // Analyze with AI
      await scanMutation.mutateAsync(file_url);
    } catch (error) {
      setAnalyzing(false);
      toast.error('Fehler beim Hochladen');
    }
  };

  const resetScanner = () => {
    setCapturedImage(null);
    setResult(null);
    setManualEdit(false);
    setAnalyzing(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = () => {
    if (!result?.meter_id || !result?.reading_value) {
      toast.error('Bitte alle Felder ausfüllen');
      return;
    }
    saveMutation.mutate(result);
  };

  return (
    <Card className="border-2 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Camera className="w-5 h-5 text-blue-600" />
          Zähler scannen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {!capturedImage ? (
          <div className="space-y-3">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleCapture}
              className="hidden"
            />
            
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full h-32 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              disabled={analyzing}
            >
              <div className="flex flex-col items-center gap-2">
                <Camera className="w-12 h-12" />
                <span className="text-lg font-semibold">Foto aufnehmen</span>
                <span className="text-sm text-blue-100">Zähler fotografieren</span>
              </div>
            </Button>

            <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-900">
              <p className="font-semibold mb-2">📸 Tipps für beste Ergebnisse:</p>
              <ul className="space-y-1 text-xs">
                <li>• Zählernummer und Stand gut sichtbar</li>
                <li>• Ausreichend Licht verwenden</li>
                <li>• Kamera gerade halten</li>
                <li>• Alle Ziffern scharf abbilden</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Annotated Image with Visual Feedback */}
            <div className="relative">
              <MeterImageAnnotation
                imageUrl={capturedImage}
                detectedRegions={result?.detected_regions}
                imageQuality={result?.image_quality}
                confidence={result?.confidence}
              />
              <Button
                size="icon"
                variant="destructive"
                onClick={resetScanner}
                className="absolute top-2 right-2 z-10"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {analyzing && (
              <div className="text-center py-8">
                <Scan className="w-12 h-12 mx-auto mb-3 text-blue-600 animate-pulse" />
                <p className="font-semibold text-slate-900">KI analysiert Bild...</p>
                <p className="text-sm text-slate-600 mt-1">Erkenne Zählernummer und Stand</p>
              </div>
            )}

            {result && !analyzing && (
              <div className="space-y-4">
                {/* AI Notes */}
                {result.ai_notes && (
                  <Card className="p-3 bg-blue-50 border-blue-200">
                    <p className="text-xs text-blue-900">
                      💡 {result.ai_notes}
                    </p>
                  </Card>
                )}

                {/* Detected Data */}
                <div className="space-y-3 bg-slate-50 rounded-lg p-4">
                  <div>
                    <label className="text-sm font-semibold block mb-2">
                      Zählernummer
                    </label>
                    <Input
                      value={result.meter_number || ''}
                      onChange={(e) => {
                        setResult({ ...result, meter_number: e.target.value });
                        setManualEdit(true);
                      }}
                      className={result.meter_id ? 'border-green-500' : 'border-amber-500'}
                    />
                    {result.meter_id && (
                      <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Zähler gefunden: {result.meter_location}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-2">
                      Zählerstand
                    </label>
                    <Input
                      type="number"
                      value={result.reading_value || ''}
                      onChange={(e) => {
                        setResult({ ...result, reading_value: parseFloat(e.target.value) });
                        setManualEdit(true);
                      }}
                      placeholder="z.B. 12345.67"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-semibold block mb-2">
                      Ablesedatum
                    </label>
                    <Input
                      type="date"
                      value={result.reading_date || new Date().toISOString().split('T')[0]}
                      onChange={(e) => {
                        setResult({ ...result, reading_date: e.target.value });
                        setManualEdit(true);
                      }}
                    />
                  </div>

                  {result.meter_type && (
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-slate-600">Typ:</span>
                      <Badge variant="outline">{result.meter_type}</Badge>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <Button
                    onClick={handleSave}
                    disabled={saveMutation.isPending || !result.meter_id}
                    className="flex-1 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Speichern
                  </Button>
                  <Button
                    variant="outline"
                    onClick={resetScanner}
                  >
                    Neu
                  </Button>
                </div>

                {!result.meter_id && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded text-sm text-amber-900">
                    ⚠️ Zähler nicht gefunden. Bitte Zählernummer manuell korrigieren.
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}