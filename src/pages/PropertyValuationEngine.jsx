import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp } from 'lucide-react';

export default function PropertyValuationEngine() {
  const { data: valuations = [] } = useQuery({
    queryKey: ['valuations'],
    queryFn: () => base44.entities.PropertyValuation.list('-valuation_date', 50)
  });

  const getTrendBadge = (trend) => {
    if (trend === 'rising') return 'bg-green-100 text-green-800';
    if (trend === 'falling') return 'bg-red-100 text-red-800';
    return 'bg-slate-100';
  };

  const totalValue = valuations.reduce((sum, v) => sum + v.estimated_value, 0);
  const avgYield = (valuations.reduce((sum, v) => sum + v.rental_yield, 0) / valuations.length || 0).toFixed(2);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-8 h-8" />
        <div>
          <h1 className="text-3xl font-bold">Property Valuation Engine</h1>
          <p className="text-slate-600">AI-basierte Immobilienbewertung</p>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">€{(totalValue / 1000000).toFixed(1)}M</div>
            <p className="text-sm text-slate-600">Portfolio-Wert</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold">{valuations.length}</div>
            <p className="text-sm text-slate-600">Bewertungen</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-3xl font-bold text-blue-600">{avgYield}%</div>
            <p className="text-sm text-slate-600">Durchschn. Rendite</p>
          </CardContent>
        </Card>
      </div>

      <div className="space-y-2">
        {valuations.map(val => (
          <Card key={val.id}>
            <CardContent className="p-4">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-semibold">Gebäude {val.building_id}</p>
                  <p className="text-sm text-slate-600">
                    €{val.estimated_value.toLocaleString()} (€{val.price_per_sqm}/m²)
                  </p>
                </div>
                <div className="flex gap-2">
                  <Badge className={getTrendBadge(val.market_trend)}>
                    {val.market_trend === 'rising' ? '↑' : val.market_trend === 'falling' ? '↓' : '→'} {val.market_trend}
                  </Badge>
                  <Badge variant="outline">{val.confidence_score}% Konfidenz</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}