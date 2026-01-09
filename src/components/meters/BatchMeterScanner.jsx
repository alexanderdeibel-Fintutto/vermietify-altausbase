import React, { useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Camera, CheckCircle, ArrowRight, RotateCw, Download } from 'lucide-react';
import { toast } from 'sonner';
import MeterImageAnnotation from './MeterImageAnnotation';

export default function BatchMeterScanner({ routeId, meters }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [capturedReadings, setCapturedReadings] = useState([]);
  const [currentImage, setCurrentImage] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const fileInputRef = useRef(null);
  const queryClient = useQueryClient();

  const currentMeter = meters[currentIndex];
  const progress = (capturedReadings.length / meters.length) * 100;

  const scanMutation = useMutation({
    mutationFn: async (imageUrl) => {
      const response = await base44.functions.invoke('scanMeterReading', {
        image_url: imageUrl,
        building_id: currentMeter.building_id
      });
      return response.data;
    },
    onSuccess: (data) => {
      setResult(data);
      setAnalyzing(false);
    }
  });

  const saveMutation = useMutation({
    mutationFn: async (data) => {
      // Validate first
      const validation = await base44.functions.invoke('validateMeterReading', {
        meter_id: data.meter_id,
        new_reading: data.reading_value,
        reading_date: data.reading_date
      });

      if (!validation.data.can_proceed) {
        throw new Error(validation.data.plausibility_check.warnings.join(', '));
      }

      // Save reading
      const reading = await base44.entities.MeterReading.create({
        meter_id: data.meter_id,
        reading_value: data.reading_value,
        reading_date: data.reading_date,
        image_url: currentImage,
        auto_detected: true,
        confidence_score: data.confidence,
        read_by: (await base44.auth.me()).email,
        plausibility_check: validation.data.plausibility_check,
        consumption: validation.data.consumption
      });

      // Update meter
      await base44.entities.Meter.update(data.meter_id, {
        current_reading: data.reading_value,
        last_reading_date: data.reading_date,
        last_reading_by: (await base44.auth.me()).email
      });

      return reading;
    },
    onSuccess: (reading) => {
      setCapturedReadings([...capturedReadings, { ...reading, meter: currentMeter }]);
      toast.success(`${currentMeter.meter_number} erfasst`);
      
      // Move to next meter
      if (currentIndex < meters.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setCurrentImage(null);
        setResult(null);
      } else {
        toast.success('Alle Zähler erfasst!');
      }
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const handleCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    
    try {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      setCurrentImage(file_url);
      await scanMutation.mutateAsync(file_url);
    } catch (error) {
      setAnalyzing(false);
      toast.error('Fehler beim Scannen');
    }
  };

  const handleSave = () => {
    if (!result?.meter_id || !result?.reading_value) {
      toast.error('Bitte alle Felder prüfen');
      return;
    }
    saveMutation.mutate(result);
  };

  const handleSkip = () => {
    if (currentIndex < meters.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setCurrentImage(null);
      setResult(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Progress Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-blue-100">Batch-Erfassung</p>
              <p className="text-2xl font-bold">{capturedReadings.length} / {meters.length}</p>
            </div>
            <Badge className="bg-white text-blue-900">
              {Math.round(progress)}%
            </Badge>
          </div>
          <Progress value={progress} className="h-2 bg-blue-400" />
        </CardContent>
      </Card>

      {/* Current Meter Info */}
      {currentMeter && (
        <Card className="border-2 border-blue-300">
          <CardHeader className="bg-blue-50">
            <CardTitle className="text-base">
              Aktueller Zähler ({currentIndex + 1}/{meters.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Zählernummer:</span>
                <span className="font-semibold">{currentMeter.meter_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Standort:</span>
                <span className="font-semibold">{currentMeter.location}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-slate-600">Typ:</span>
                <Badge variant="outline">{currentMeter.meter_type}</Badge>
              </div>
              {currentMeter.current_reading && (
                <div className="flex justify-between">
                  <span className="text-sm text-slate-600">Letzter Stand:</span>
                  <span className="font-semibold">{currentMeter.current_reading} {currentMeter.unit}</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scanner */}
      {!currentImage ? (
        <div>
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
            className="w-full h-32 bg-gradient-to-br from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
            disabled={analyzing}
          >
            <div className="flex flex-col items-center gap-2">
              <Camera className="w-12 h-12" />
              <span className="text-lg font-semibold">Zähler fotografieren</span>
            </div>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <MeterImageAnnotation
            imageUrl={currentImage}
            detectedRegions={result?.detected_regions}
            imageQuality={result?.image_quality}
            confidence={result?.confidence}
          />

          {result && !analyzing && (
            <div className="flex gap-2">
              <Button
                onClick={handleSave}
                disabled={saveMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Speichern & Weiter
              </Button>
              <Button
                variant="outline"
                onClick={handleSkip}
              >
                Überspringen
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setCurrentImage(null);
                  setResult(null);
                }}
              >
                <RotateCw className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Captured List */}
      {capturedReadings.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center justify-between">
              <span>Erfasste Zähler</span>
              <Button size="sm" variant="outline">
                <Download className="w-3 h-3 mr-2" />
                Export
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {capturedReadings.map((reading, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded border border-green-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <div>
                      <p className="text-sm font-semibold">{reading.meter.meter_number}</p>
                      <p className="text-xs text-slate-600">{reading.meter.location}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{reading.reading_value}</p>
                    <Badge className="text-xs bg-green-100 text-green-800">
                      {Math.round(reading.confidence_score * 100)}%
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}