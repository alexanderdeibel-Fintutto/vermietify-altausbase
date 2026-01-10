import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Upload, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export default function ContractDataExtractor() {
  const [extractedData, setExtractedData] = useState(null);

  const extractMutation = useMutation({
    mutationFn: async (file) => {
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      const response = await base44.functions.invoke('extractContractData', { file_url });
      return response.data;
    },
    onSuccess: (data) => {
      setExtractedData(data);
      toast.success('Vertragsdaten extrahiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="w-5 h-5" />
          Mietvertrags-Extraktion
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            KI extrahiert automatisch: Mieter, Miete, Dauer, Nebenkosten, Kaution
          </p>
        </div>

        <input
          type="file"
          accept=".pdf,.jpg,.png"
          onChange={(e) => e.target.files?.[0] && extractMutation.mutate(e.target.files[0])}
          className="hidden"
          id="contract-upload"
        />
        <label htmlFor="contract-upload">
          <Button asChild className="w-full" disabled={extractMutation.isPending}>
            <span>
              <Upload className="w-4 h-4 mr-2" />
              {extractMutation.isPending ? 'Analysiere...' : 'Mietvertrag hochladen'}
            </span>
          </Button>
        </label>

        {extractedData && (
          <div className="space-y-3 p-4 bg-green-50 rounded-lg">
            <p className="font-semibold text-sm text-green-800">✓ Extrahierte Daten:</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 bg-white rounded">
                <p className="text-xs text-slate-600">Mieter</p>
                <p className="font-semibold text-sm">{extractedData.tenant_name}</p>
              </div>
              <div className="p-2 bg-white rounded">
                <p className="text-xs text-slate-600">Kaltmiete</p>
                <p className="font-semibold text-sm">{extractedData.base_rent}€</p>
              </div>
              <div className="p-2 bg-white rounded">
                <p className="text-xs text-slate-600">Nebenkosten</p>
                <p className="font-semibold text-sm">{extractedData.utilities}€</p>
              </div>
              <div className="p-2 bg-white rounded">
                <p className="text-xs text-slate-600">Kaution</p>
                <p className="font-semibold text-sm">{extractedData.deposit}€</p>
              </div>
              <div className="p-2 bg-white rounded col-span-2">
                <p className="text-xs text-slate-600">Mietdauer</p>
                <p className="font-semibold text-sm">
                  {extractedData.start_date} bis {extractedData.end_date || 'unbefristet'}
                </p>
              </div>
            </div>
            <Badge className="bg-green-600">Konfidenz: {extractedData.confidence}%</Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}