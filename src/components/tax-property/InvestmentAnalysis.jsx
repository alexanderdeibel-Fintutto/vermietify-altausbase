import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { TrendingUp, Target } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function InvestmentAnalysis() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const performanceData = buildings.slice(0, 6).map(b => ({
    name: b.name?.slice(0, 10) || 'Objekt',
    roi: ((b.market_value - (b.purchase_price || 0)) / (b.purchase_price || 1)) * 100,
    rental_yield: b.total_rent ? (b.total_rent * 12 / b.market_value) * 100 : 0
  }));

  const avgROI = performanceData.reduce((sum, p) => sum + p.roi, 0) / performanceData.length;
  const avgYield = performanceData.reduce((sum, p) => sum + p.rental_yield, 0) / performanceData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Investment-Analyse
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900">Ø ROI</p>
            <p className="text-2xl font-bold text-blue-900">
              {avgROI.toFixed(1)}%
            </p>
          </div>
          <div className="p-3 bg-green-50 rounded-lg">
            <p className="text-xs text-green-900">Ø Rendite</p>
            <p className="text-2xl font-bold text-green-900">
              {avgYield.toFixed(1)}%
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="roi" stroke="#3b82f6" name="ROI %" />
            <Line type="monotone" dataKey="rental_yield" stroke="#10b981" name="Rendite %" />
          </LineChart>
        </ResponsiveContainer>

        <div className="space-y-2">
          <p className="text-sm font-semibold">Top Performer:</p>
          {performanceData
            .sort((a, b) => b.roi - a.roi)
            .slice(0, 3)
            .map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-2 bg-green-50 rounded">
                <span className="text-sm">{item.name}</span>
                <Badge className="bg-green-600">+{item.roi.toFixed(1)}%</Badge>
              </div>
            ))}
        </div>
      </CardContent>
    </Card>
  );
}