import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { FileSpreadsheet, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomReportDesigner() {
  const [fields, setFields] = useState({
    income: true,
    expenses: true,
    tax: true,
    buildings: false
  });

  const generateMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateCustomReport', { fields });
      return response.data;
    },
    onSuccess: () => {
      toast.success('Custom Report erstellt');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" />
          Custom Report Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {Object.keys(fields).map(field => (
          <div key={field} className="flex items-center gap-2">
            <Checkbox
              checked={fields[field]}
              onCheckedChange={(checked) => setFields({ ...fields, [field]: checked })}
            />
            <label className="text-sm">{field}</label>
          </div>
        ))}
        <Button onClick={() => generateMutation.mutate()} className="w-full">
          <Download className="w-4 h-4 mr-2" />
          Report generieren
        </Button>
      </CardContent>
    </Card>
  );
}