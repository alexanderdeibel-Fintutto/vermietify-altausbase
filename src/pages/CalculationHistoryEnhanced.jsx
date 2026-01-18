import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import PageHeader from '@/components/shared/PageHeader';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Calculator, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import TimeAgo from '@/components/shared/TimeAgo';

export default function CalculationHistoryEnhanced() {
  const { data: calculations = [] } = useQuery({
    queryKey: ['calculations'],
    queryFn: () => base44.entities.CalculationHistory.list('-created_date')
  });

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <PageHeader
        title="Berechnungshistorie"
        subtitle={`${calculations.length} gespeicherte Berechnungen`}
      />

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
        {calculations.map((calc) => (
          <Card key={calc.id}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calculator className="h-4 w-4" />
                {calc.calculator_type}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <div className="text-sm text-[var(--theme-text-muted)] mb-1">
                  {calc.primary_result_label}
                </div>
                <div className="text-2xl font-bold">
                  {calc.primary_result}
                </div>
              </div>
              <TimeAgo date={calc.created_date} className="text-xs text-[var(--theme-text-muted)] mb-3" />
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Öffnen
                </Button>
                {calc.pdf_generated && (
                  <Button variant="ghost" size="sm">
                    <Download className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}