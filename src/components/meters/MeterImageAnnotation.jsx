import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertTriangle, Lightbulb, Focus } from 'lucide-react';

export default function MeterImageAnnotation({ imageUrl, detectedRegions, imageQuality, confidence }) {
  const canvasRef = useRef(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!imageUrl || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate dimensions maintaining aspect ratio
      const maxWidth = canvas.parentElement?.clientWidth || 400;
      const scale = maxWidth / img.width;
      const width = maxWidth;
      const height = img.height * scale;

      canvas.width = width;
      canvas.height = height;
      setImageDimensions({ width, height });

      // Draw image
      ctx.drawImage(img, 0, 0, width, height);

      // Draw annotations if available
      if (detectedRegions) {
        drawAnnotations(ctx, width, height, detectedRegions);
      }

      setImageLoaded(true);
    };

    img.src = imageUrl;
  }, [imageUrl, detectedRegions]);

  const drawAnnotations = (ctx, canvasWidth, canvasHeight, regions) => {
    // Draw meter number region
    if (regions.meter_number_position) {
      const pos = regions.meter_number_position;
      const x = (pos.x / 100) * canvasWidth;
      const y = (pos.y / 100) * canvasHeight;
      const w = (pos.width / 100) * canvasWidth;
      const h = (pos.height / 100) * canvasHeight;

      // Draw rectangle
      ctx.strokeStyle = '#3b82f6';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Draw label background
      ctx.fillStyle = '#3b82f6';
      ctx.fillRect(x, y - 25, 120, 25);

      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Zählernummer', x + 5, y - 8);
    }

    // Draw reading region
    if (regions.reading_position) {
      const pos = regions.reading_position;
      const x = (pos.x / 100) * canvasWidth;
      const y = (pos.y / 100) * canvasHeight;
      const w = (pos.width / 100) * canvasWidth;
      const h = (pos.height / 100) * canvasHeight;

      // Draw rectangle
      ctx.strokeStyle = '#10b981';
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, w, h);

      // Draw label background
      ctx.fillStyle = '#10b981';
      ctx.fillRect(x, y - 25, 110, 25);

      // Draw label text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Zählerstand', x + 5, y - 8);
    }
  };

  const getQualityIcon = (score) => {
    if (score >= 0.8) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (score >= 0.6) return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    return <AlertTriangle className="w-4 h-4 text-red-600" />;
  };

  const getQualityColor = (score) => {
    if (score >= 0.8) return 'text-green-600';
    if (score >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-3">
      <div className="relative">
        <canvas
          ref={canvasRef}
          className="w-full rounded-lg border-2 border-slate-200 shadow-sm"
        />
        
        {/* Confidence Overlay */}
        {imageLoaded && confidence !== undefined && (
          <div className="absolute top-3 right-3">
            <Badge className={
              confidence >= 0.8 ? 'bg-green-600' :
              confidence >= 0.6 ? 'bg-yellow-600' :
              'bg-red-600'
            }>
              {Math.round(confidence * 100)}% Genauigkeit
            </Badge>
          </div>
        )}
      </div>

      {/* Image Quality Indicators */}
      {imageQuality && (
        <Card className="p-3">
          <div className="space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Focus className="w-4 h-4" />
              Bildqualität
            </p>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="flex items-center gap-1">
                {getQualityIcon(imageQuality.sharpness)}
                <div>
                  <p className={getQualityColor(imageQuality.sharpness)}>
                    {Math.round((imageQuality.sharpness || 0) * 100)}%
                  </p>
                  <p className="text-slate-600">Schärfe</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getQualityIcon(imageQuality.lighting)}
                <div>
                  <p className={getQualityColor(imageQuality.lighting)}>
                    {Math.round((imageQuality.lighting || 0) * 100)}%
                  </p>
                  <p className="text-slate-600">Licht</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                {getQualityIcon(imageQuality.angle)}
                <div>
                  <p className={getQualityColor(imageQuality.angle)}>
                    {Math.round((imageQuality.angle || 0) * 100)}%
                  </p>
                  <p className="text-slate-600">Winkel</p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Quality Tips */}
      {imageQuality && (
        (imageQuality.sharpness < 0.7 || imageQuality.lighting < 0.7 || imageQuality.angle < 0.7) && (
          <Card className="p-3 bg-amber-50 border-amber-200">
            <div className="flex gap-2">
              <Lightbulb className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-amber-900">
                <p className="font-semibold mb-1">Tipps zur Verbesserung:</p>
                <ul className="space-y-0.5">
                  {imageQuality.sharpness < 0.7 && (
                    <li>• Kamera stabilisieren und Ziffern scharf stellen</li>
                  )}
                  {imageQuality.lighting < 0.7 && (
                    <li>• Bessere Beleuchtung verwenden oder Blitz einschalten</li>
                  )}
                  {imageQuality.angle < 0.7 && (
                    <li>• Kamera frontal zum Zähler ausrichten</li>
                  )}
                </ul>
              </div>
            </div>
          </Card>
        )
      )}
    </div>
  );
}