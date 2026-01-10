import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function QuarterlyReportGenerator() {
  const [quarter, setQuarter] = React.useState('Q1-2026');

  const generateMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('generateQuarterlyReport', { quarter });
    },
    onSuccess: () => {
      toast.success('Quartalsbericht erstellt');
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
        <Select value={quarter} onValueChange={setQuarter}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Q1-2026">Q1 2026</SelectItem>
            <SelectItem value="Q4-2025">Q4 2025</SelectItem>
            <SelectItem value="Q3-2025">Q3 2025</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => generateMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Bericht generieren
        </Button>
      </CardContent>
    </Card>
  );
}