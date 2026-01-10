import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileText, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function AnnualClosingGenerator() {
  const [year, setYear] = React.useState('2025');

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateAnnualClosing', { year });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Jahresabschluss erstellt');
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
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="2025">2025</SelectItem>
            <SelectItem value="2024">2024</SelectItem>
            <SelectItem value="2023">2023</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => generateMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Jahresabschluss generieren
        </Button>
      </CardContent>
    </Card>
  );
}