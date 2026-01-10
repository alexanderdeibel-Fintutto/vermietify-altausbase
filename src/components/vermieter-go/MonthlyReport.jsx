import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function MonthlyReport({ buildingId }) {
  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateMonthlyReport', {
        building_id: buildingId,
        month: new Date().toISOString().slice(0, 7)
      });
      return response.data;
    },
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = data.pdf_url;
      link.download = `Monatsbericht_${new Date().toLocaleDateString('de-DE')}.pdf`;
      link.click();
      toast.success('Bericht generiert');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <FileText className="w-4 h-4" />
          Monatsberichte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="w-full bg-purple-600"
        >
          <Download className="w-4 h-4 mr-2" />
          {generateMutation.isPending ? 'Erstelle PDF...' : 'Aktuellen Monat generieren'}
        </Button>
      </CardContent>
    </Card>
  );
}