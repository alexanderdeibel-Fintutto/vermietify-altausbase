import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Target, TrendingUp } from 'lucide-react';

export default function EquityReturnAnalysis() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const analysis = buildings.map(b => {
    const equity = (b.purchase_price || 0) * 0.20; // 20% Eigenkapital angenommen
    const annualRent = (b.total_rent || 0) * 12;
    const annualExpenses = annualRent * 0.30; // 30% Kosten angenommen
    const netIncome = annualRent - annualExpenses;
    const equityReturn = equity > 0 ? (netIncome / equity) * 100 : 0;
    
    return {
      name: b.name,
      equity,
      netIncome,
      equityReturn
    };
  }).sort((a, b) => b.equityReturn - a.equityReturn);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Eigenkapitalrendite
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {analysis.slice(0, 5).map(item => (
          <div key={item.name} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <div className="flex-1">
                <p className="font-semibold text-sm">{item.name}</p>
                <p className="text-xs text-slate-600">
                  EK: {item.equity.toLocaleString('de-DE')} €
                </p>
              </div>
              <Badge className={
                item.equityReturn > 15 ? 'bg-green-600' :
                item.equityReturn > 10 ? 'bg-blue-600' :
                'bg-orange-600'
              }>
                {item.equityReturn.toFixed(1)}%
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-green-600">
              <TrendingUp className="w-3 h-3" />
              Nettoertrag: {item.netIncome.toLocaleString('de-DE')} € p.a.
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}