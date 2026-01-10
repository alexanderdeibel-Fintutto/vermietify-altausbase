import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Camera, Receipt, Zap } from 'lucide-react';
import { toast } from 'sonner';

export default function ExpenseScanner() {
  const [scanning, setScanning] = useState(false);
  const queryClient = useQueryClient();

  const scanMutation = useMutation({
    mutationFn: async (file) => {
      setScanning(true);
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      const aiResult = await base44.integrations.Core.InvokeLLM({
        prompt: 'Analysiere diesen Beleg und extrahiere: Betrag, Datum, Kategorie (z.B. Büromaterial, Reisekosten, Bewirtung), Lieferant, USt-Betrag',
        file_urls: [file_url],
        response_json_schema: {
          type: 'object',
          properties: {
            amount: { type: 'number' },
            date: { type: 'string' },
            category: { type: 'string' },
            vendor: { type: 'string' },
            vat_amount: { type: 'number' }
          }
        }
      });

      return await base44.entities.FinancialItem.create({
        amount: aiResult.amount,
        date: aiResult.date || new Date().toISOString().split('T')[0],
        description: `${aiResult.category} - ${aiResult.vendor}`,
        type: 'expense',
        category: aiResult.category,
        vat_amount: aiResult.vat_amount,
        document_url: file_url,
        is_tax_relevant: true
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['financialItems'] });
      toast.success('Beleg gescannt & kategorisiert');
      setScanning(false);
    }
  });

  const handleScan = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf';
    input.capture = 'environment';
    input.onchange = (e) => {
      const file = e.target.files?.[0];
      if (file) scanMutation.mutate(file);
    };
    input.click();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Receipt className="w-5 h-5" />
          Betriebsausgaben-Scanner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={handleScan} disabled={scanning} className="w-full h-24 bg-gradient-to-r from-green-600 to-emerald-600">
          <div className="flex flex-col items-center gap-2">
            {scanning ? <Zap className="w-10 h-10 animate-pulse" /> : <Camera className="w-10 h-10" />}
            <span className="text-lg font-semibold">{scanning ? 'Scanne & analysiere...' : 'Beleg scannen'}</span>
            <span className="text-sm text-green-100">KI erkennt automatisch Betrag & Kategorie</span>
          </div>
        </Button>
      </CardContent>
    </Card>
  );
}