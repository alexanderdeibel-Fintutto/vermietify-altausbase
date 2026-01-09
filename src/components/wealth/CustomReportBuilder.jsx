import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Download, FileText } from 'lucide-react';

const reportSections = [
  { id: 'summary', label: 'Zusammenfassung' },
  { id: 'allocation', label: 'Asset-Allocation' },
  { id: 'performance', label: 'Performance' },
  { id: 'benchmarks', label: 'Benchmark-Vergleich' },
  { id: 'risks', label: 'Risikoanalyse' },
  { id: 'tax', label: 'Steuerliche Übersicht' },
  { id: 'recommendations', label: 'Empfehlungen' }
];

export default function CustomReportBuilder({ portfolioId, userId }) {
  const [selectedSections, setSelectedSections] = useState(['summary', 'allocation', 'performance']);

  const generateMutation = useMutation({
    mutationFn: async () => {
      const result = await base44.functions.invoke('generatePortfolioReport', {
        portfolioId,
        userId,
        sections: selectedSections
      });
      return result.data;
    },
    onSuccess: (data) => {
      // Download PDF
      const link = document.createElement('a');
      link.href = data.pdf_url;
      link.download = `Portfolio-Report-${new Date().toISOString().split('T')[0]}.pdf`;
      link.click();
    }
  });

  const toggleSection = (id) => {
    setSelectedSections(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Benutzerdefinierter Report
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          {reportSections.map(section => (
            <div key={section.id} className="flex items-center gap-2">
              <Checkbox
                id={section.id}
                checked={selectedSections.includes(section.id)}
                onCheckedChange={() => toggleSection(section.id)}
              />
              <Label htmlFor={section.id} className="font-light cursor-pointer">
                {section.label}
              </Label>
            </div>
          ))}
        </div>

        <Button
          onClick={() => generateMutation.mutate()}
          disabled={selectedSections.length === 0 || generateMutation.isPending}
          className="w-full gap-2"
        >
          <Download className="w-4 h-4" />
          {generateMutation.isPending ? 'Wird generiert...' : 'Report generieren'}
        </Button>
      </CardContent>
    </Card>
  );
}