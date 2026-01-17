import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { VfListPageHeader } from '@/components/list-pages/VfListPage';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, Download, Share2, Bookmark } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function CalculationHistory() {
  const { data: calculations = [] } = useQuery({
    queryKey: ['calculations'],
    queryFn: () => base44.entities.CalculationHistory.list('-created_date', 50)
  });

  const calculatorLabels = {
    'rendite': 'Rendite-Rechner',
    'afa': 'AfA-Rechner',
    'indexmiete': 'Indexmieten-Rechner',
    'cashflow': 'Cashflow-Rechner',
    'kaufpreis': 'Kaufpreis-Rechner',
    'tilgung': 'Tilgungs-Rechner',
    'wertentwicklung': 'Wertentwicklungs-Rechner'
  };

  return (
    <div className="p-6">
      <VfListPageHeader
        title="Berechnungs-Historie"
        description={`${calculations.length} Berechnungen gespeichert`}
      />

      <div className="grid gap-4">
        {calculations.map((calc) => (
          <Card key={calc.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-lg bg-[var(--vf-gradient-primary)] flex items-center justify-center text-white flex-shrink-0">
                    <Calculator className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-semibold mb-1">
                      {calculatorLabels[calc.calculator_type] || calc.calculator_type}
                    </div>
                    <div className="text-2xl font-bold text-[var(--vf-primary-600)] mb-1">
                      {calc.primary_result_label}: {calc.primary_result}
                    </div>
                    <div className="text-sm text-[var(--theme-text-muted)]">
                      {new Date(calc.created_date).toLocaleString('de-DE')}
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" title="Als PDF speichern">
                    <Download className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" title="Teilen">
                    <Share2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    title="Speichern"
                    className={cn(calc.saved && "text-[var(--vf-warning-500)]")}
                  >
                    <Bookmark className={cn("h-4 w-4", calc.saved && "fill-current")} />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {calculations.length === 0 && (
          <div className="text-center py-12">
            <Calculator className="h-16 w-16 mx-auto mb-4 text-[var(--theme-text-muted)] opacity-30" />
            <h3 className="font-semibold mb-2">Keine Berechnungen</h3>
            <p className="text-[var(--theme-text-muted)]">
              Nutzen Sie unsere kostenlosen Rechner, um Berechnungen zu erstellen
            </p>
          </div>
        )}
      </div>
    </div>
  );
}