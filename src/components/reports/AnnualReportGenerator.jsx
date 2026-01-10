import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnualReportGenerator() {
  const [year, setYear] = useState(new Date().getFullYear());

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateAnnualReport', { year });
      return response.data;
    },
    onSuccess: (data) => {
      window.open(data.pdf_url, '_blank');
      toast.success('Jahresbericht erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Jahresabschluss
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Select value={year.toString()} onValueChange={(v) => setYear(parseInt(v))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {[2024, 2025, 2026].map(y => (
              <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          onClick={() => generateMutation.mutate()}
          disabled={generateMutation.isPending}
          className="w-full bg-blue-600"
        >
          <Download className="w-4 h-4 mr-2" />
          {generateMutation.isPending ? 'Erstelle PDF...' : 'Jahresbericht generieren'}
        </Button>
      </CardContent>
    </Card>
  );
}