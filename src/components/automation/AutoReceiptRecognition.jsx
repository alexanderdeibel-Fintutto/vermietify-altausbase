import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Camera, Upload } from 'lucide-react';
import { toast } from 'sonner';

export default function AutoReceiptRecognition() {
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('recognizeAndBookReceipt', { file_url });
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['financialItems'] });
      toast.success(`Beleg erkannt: ${data.vendor} - ${data.amount}€`);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="w-5 h-5" />
          Beleg-Erkennung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Badge className="bg-blue-600">Auto-Buchung aktiviert</Badge>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          onChange={(e) => e.target.files?.[0] && scanMutation.mutate(e.target.files[0])}
          className="hidden"
          id="receipt-scan"
        />
        <label htmlFor="receipt-scan">
          <Button asChild className="w-full">
            <span>
              <Upload className="w-4 h-4 mr-2" />
              Beleg scannen & buchen
            </span>
          </Button>
        </label>
      </CardContent>
    </Card>
  );
}