import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Layout, Download } from 'lucide-react';
import { toast } from 'sonner';

export default function CustomReportDesigner() {
  const [sections, setSections] = useState([]);

  const generateMutation = useMutation({
    mutationFn: async () => {
      await base44.functions.invoke('generateCustomReport', { sections });
    },
    onSuccess: () => {
      toast.success('Report erstellt');
    }
  });

  const availableSections = [
    { id: 'revenue', name: 'Einnahmen-Übersicht' },
    { id: 'expenses', name: 'Ausgaben-Details' },
    { id: 'occupancy', name: 'Vermietungsquote' },
    { id: 'maintenance', name: 'Wartungskosten' },
    { id: 'tax', name: 'Steuer-Übersicht' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Layout className="w-5 h-5" />
          Custom-Report-Designer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-slate-600">Wählen Sie Report-Abschnitte:</p>
        {availableSections.map(section => (
          <div key={section.id} className="flex items-center gap-2">
            <Checkbox 
              checked={sections.includes(section.id)}
              onCheckedChange={(checked) => {
                if (checked) {
                  setSections([...sections, section.id]);
                } else {
                  setSections(sections.filter(id => id !== section.id));
                }
              }}
            />
            <span className="text-sm">{section.name}</span>
          </div>
        ))}
        <Button onClick={() => generateMutation.mutate()} className="w-full" disabled={sections.length === 0}>
          <Download className="w-4 h-4 mr-2" />
          Report generieren
        </Button>
      </CardContent>
    </Card>
  );
}