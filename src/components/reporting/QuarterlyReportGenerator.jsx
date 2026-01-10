import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function QuarterlyReportGenerator() {
  const [quarter, setQuarter] = React.useState('Q1');
  const [year, setYear] = React.useState('2026');

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateQuarterlyReport', { quarter, year });
      return response.data;
    },
    onSuccess: (data) => {
      const blob = new Blob([data.pdf], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Quartalsbericht_${quarter}_${year}.pdf`;
      a.click();
      toast.success('Bericht erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Quartalsberichte
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Select value={quarter} onValueChange={setQuarter}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Q1">Q1</SelectItem>
              <SelectItem value="Q2">Q2</SelectItem>
              <SelectItem value="Q3">Q3</SelectItem>
              <SelectItem value="Q4">Q4</SelectItem>
            </SelectContent>
          </Select>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2026">2026</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => generateMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Bericht generieren
        </Button>
      </CardContent>
    </Card>
  );
}