import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { MapPin, TrendingUp, TrendingDown } from 'lucide-react';

export default function RegionalMarketAnalysis() {
  const { data: analysis } = useQuery({
    queryKey: ['regionalMarket'],
    queryFn: async () => {
      const response = await base44.functions.invoke('analyzeRegionalMarket', {});
      return response.data;
    }
  });

  if (!analysis) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="w-5 h-5" />
          Regionale Marktanalyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {analysis.regions.map(region => (
          <div key={region.city} className="p-3 bg-slate-50 rounded-lg">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-semibold text-sm">{region.city}</p>
                <p className="text-xs text-slate-600">{region.properties} Objekte</p>
              </div>
              <div className="text-right">
                <Badge className={region.trend === 'up' ? 'bg-green-600' : 'bg-red-600'}>
                  {region.trend === 'up' ? <TrendingUp className="w-3 h-3 inline mr-1" /> : <TrendingDown className="w-3 h-3 inline mr-1" />}
                  {region.price_change}%
                </Badge>
                <p className="text-xs text-slate-600 mt-1">Ø {region.avg_sqm_price}€/m²</p>
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}