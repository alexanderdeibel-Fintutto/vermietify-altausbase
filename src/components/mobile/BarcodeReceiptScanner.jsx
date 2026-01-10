import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { ScanLine } from 'lucide-react';
import { toast } from 'sonner';

export default function BarcodeReceiptScanner() {
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('scanBarcodeReceipt', { file_url });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['financialItems'] });
      toast.success(`Beleg gescannt: ${data.total}€`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ScanLine className="w-5 h-5" />
          Barcode-Scanner
        </CardTitle>
      </CardHeader>
      <CardContent>
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
            <span>
              <ScanLine className="w-4 h-4 mr-2" />
              Beleg scannen
            </span>
          </Button>
        </label>
      </CardContent>
    </Card>
  );
}