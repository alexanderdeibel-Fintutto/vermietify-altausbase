import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ScanLine } from 'lucide-react';
import { toast } from 'sonner';

export default function BarcodeReceiptScanner() {
  const [scannedCode, setScannedCode] = useState('');

  const scanMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('scanBarcodeReceipt', { file_url });
      return response.data;
    },
    onSuccess: (data) => {
      setScannedCode(data.barcode);
      toast.success('Beleg gescannt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="w-5 h-5" />
          Beleg-Scanner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.target.files?.[0] && scanMutation.mutate(e.target.files[0])}
          className="hidden"
          id="barcode-scan"
        />
        <label htmlFor="barcode-scan">
          <Button asChild className="w-full">
            <span>Beleg scannen</span>
          </Button>
        </label>
        {scannedCode && (
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-slate-600">Erkannter Code:</p>
            <Badge className="bg-green-600 font-mono">{scannedCode}</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}