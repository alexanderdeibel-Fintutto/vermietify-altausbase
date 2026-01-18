import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Building, TrendingUp } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function PortfolioSummaryWidget() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const totalValue = buildings.reduce((sum, b) => sum + (b.kaufpreis || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Building className="h-5 w-5" />
          Portfolio-Übersicht
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-[var(--theme-text-muted)] mb-1">Gesamtwert</div>
            <CurrencyDisplay amount={totalValue} className="text-3xl font-bold" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-[var(--theme-text-muted)] mb-1">Objekte</div>
              <div className="text-2xl font-bold">{buildings.length}</div>
            </div>
            <div>
              <div className="text-sm text-[var(--theme-text-muted)] mb-1">Ø Rendite</div>
              <div className="text-2xl font-bold text-[var(--vf-success-600)]">7,2%</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}