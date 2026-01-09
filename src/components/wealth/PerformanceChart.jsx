import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function PerformanceChart({ assetId, days = 90 }) {
  const { data: priceHistory = [], isLoading } = useQuery({
    queryKey: ['priceHistory', assetId, days],
    queryFn: async () => {
      if (!assetId) return [];
      
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      
      const history = await base44.entities.PriceHistory.filter(
        { asset_portfolio_id: assetId },
        'recorded_at',
        500
      );
      
      return history?.filter(h => new Date(h.recorded_at) >= startDate) || [];
    },
    enabled: !!assetId,
    staleTime: 2 * 60 * 60 * 1000 // 2 hour cache
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-80">
          <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (!priceHistory.length) {
    return (
      <Card>
        <CardContent className="p-6 flex items-center justify-center h-80">
          <p className="text-slate-500 font-light">Keine Performance-Daten verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const chartData = priceHistory.map(h => ({
    date: new Date(h.recorded_at).toLocaleDateString('de-DE'),
    price: h.price
  }));

  const minPrice = Math.min(...priceHistory.map(h => h.price));
  const maxPrice = Math.max(...priceHistory.map(h => h.price));
  const avgPrice = priceHistory.reduce((sum, h) => sum + h.price, 0) / priceHistory.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-light">Performance-Verlauf ({days} Tage)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="price" stroke="#8884d8" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <span className="text-slate-600 font-light">Minimum</span>
            <div className="text-lg font-medium text-slate-900">{minPrice.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-slate-600 font-light">Durchschnitt</span>
            <div className="text-lg font-medium text-slate-900">{avgPrice.toFixed(2)}</div>
          </div>
          <div>
            <span className="text-slate-600 font-light">Maximum</span>
            <div className="text-lg font-medium text-slate-900">{maxPrice.toFixed(2)}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}