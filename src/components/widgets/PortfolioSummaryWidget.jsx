import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Briefcase } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function PortfolioSummaryWidget() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const totalValue = buildings.reduce((sum, b) => sum + (b.purchase_price || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Briefcase className="h-5 w-5" />
          Portfolio-Wert
        </CardTitle>
      </CardHeader>
      <CardContent>
        <CurrencyDisplay amount={totalValue} className="text-3xl font-bold mb-4" />
        <div className="grid grid-cols-2 gap-4 pt-4 border-t">
          <div>
            <div className="text-xs text-[var(--theme-text-muted)]">Objekte</div>
            <div className="text-xl font-bold">{buildings.length}</div>
          </div>
          <div>
            <div className="text-xs text-[var(--theme-text-muted)]">Ø Wert</div>
            <CurrencyDisplay 
              amount={buildings.length > 0 ? totalValue / buildings.length : 0}
              className="text-xl font-bold"
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}