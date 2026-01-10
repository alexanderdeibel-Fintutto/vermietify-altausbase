import React, { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PenTool, Trash2, Check } from 'lucide-react';
import { toast } from 'sonner';

export default function DigitalSignature({ unitId, protocolType = 'handover' }) {
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    e.preventDefault();
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    const x = e.touches ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.touches ? e.touches[0].clientY - rect.top : e.clientY - rect.top;
    
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const canvas = canvasRef.current;
      const signatureData = canvas.toDataURL('image/png');
      
      // Convert to blob and upload
      const blob = await (await fetch(signatureData)).blob();
      const file = new File([blob], 'signature.png', { type: 'image/png' });
      const { file_url } = await base44.integrations.Core.UploadFile({ file });

      // Create protocol record
      return await base44.entities.Document.create({
        name: `${protocolType === 'handover' ? 'Übergabe' : 'Rückgabe'}protokoll`,
        category: 'Verwaltung',
        status: 'unterschrieben',
        unit_id: unitId,
        file_url,
        signed_date: new Date().toISOString()
      });
    },
    onSuccess: () => {
      toast.success('Unterschrift gespeichert');
      clearSignature();
    }
  });

  React.useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
  }, []);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <PenTool className="w-4 h-4" />
          Digitale Unterschrift
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="border-2 border-dashed border-slate-300 rounded-lg overflow-hidden">
          <canvas
            ref={canvasRef}
            width={320}
            height={160}
            className="w-full touch-none bg-white"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={clearSignature}
            disabled={!hasSignature}
            className="flex-1"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Löschen
          </Button>
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!hasSignature || saveMutation.isPending}
            className="flex-1 bg-green-600 hover:bg-green-700"
          >
            <Check className="w-4 h-4 mr-2" />
            Speichern
          </Button>
        </div>

        <p className="text-xs text-slate-600 text-center">
          Unterschreiben Sie mit dem Finger oder Stift
        </p>
      </CardContent>
    </Card>
  );
}