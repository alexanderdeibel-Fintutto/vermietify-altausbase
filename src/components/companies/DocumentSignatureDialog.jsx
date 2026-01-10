import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Trash2, Save } from 'lucide-react';

export default function DocumentSignatureDialog({ isOpen, onClose, documentId, companyName }) {
  const canvasRef = useRef(null);
  const [signaturePad, setSignaturePad] = useState(null);
  const [signerName, setSignerName] = useState('');
  const [isDrawing, setIsDrawing] = useState(false);

  React.useEffect(() => {
    if (isOpen && canvasRef.current && !signaturePad) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      setSignaturePad({ canvas, ctx });
    }
  }, [isOpen, signaturePad]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!canvasRef.current || !signerName) {
        alert('Signatur und Name erforderlich');
        return;
      }

      const signatureUrl = canvasRef.current.toDataURL('image/png');
      const uploadResult = await base44.integrations.Core.UploadFile({
        file: new Blob([Buffer.from(signatureUrl.split(',')[1], 'base64')], { type: 'image/png' })
      });

      // Notify via Slack
      await base44.functions.invoke('notifyDocumentSigned', {
        document_id: documentId,
        signer_name: signerName,
        company_name: companyName,
        signature_url: uploadResult.file_url
      });

      onClose();
    }
  });

  const startDrawing = (e) => {
    setIsDrawing(true);
    const rect = canvasRef.current.getBoundingClientRect();
    signaturePad.ctx.beginPath();
    signaturePad.ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const rect = canvasRef.current.getBoundingClientRect();
    signaturePad.ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    signaturePad.ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    signaturePad.ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Dokument digital signieren</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-slate-700">Signaturname</label>
            <Input
              placeholder="Ihr Name"
              value={signerName}
              onChange={(e) => setSignerName(e.target.value)}
              className="mt-1"
            />
          </div>

          <div>
            <label className="text-sm font-medium text-slate-700 mb-2 block">
              Signieren Sie hier
            </label>
            <canvas
              ref={canvasRef}
              width={400}
              height={150}
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              className="border-2 border-dashed border-slate-300 rounded-lg bg-white cursor-crosshair w-full"
              style={{ touchAction: 'none' }}
            />
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={clearSignature}
              className="flex-1 gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Löschen
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={saveMutation.isPending}
              className="flex-1 gap-2"
            >
              <Save className="w-4 h-4" />
              Signieren
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}