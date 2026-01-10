import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function WealthAllocationChart() {
  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list(null, 100)
  });

  const { data: assets = [] } = useQuery({
    queryKey: ['assets'],
    queryFn: () => base44.entities.AssetPortfolio.list(null, 100)
  });

  const totalPropertyValue = buildings.reduce((sum, b) => sum + (b.market_value || 0), 0);
  const totalStocks = assets.filter(a => a.asset_type === 'stock').reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalBonds = assets.filter(a => a.asset_type === 'bond').reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalCrypto = assets.filter(a => a.asset_type === 'crypto').reduce((sum, a) => sum + (a.current_value || 0), 0);
  const totalCash = assets.filter(a => a.asset_type === 'cash').reduce((sum, a) => sum + (a.current_value || 0), 0);

  const data = [
    { name: 'Immobilien', value: totalPropertyValue, color: '#3b82f6' },
    { name: 'Aktien', value: totalStocks, color: '#10b981' },
    { name: 'Anleihen', value: totalBonds, color: '#f59e0b' },
    { name: 'Krypto', value: totalCrypto, color: '#8b5cf6' },
    { name: 'Bargeld', value: totalCash, color: '#6b7280' }
  ].filter(item => item.value > 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Vermögensaufteilung</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={100}
              label={(entry) => `${entry.name}: ${((entry.value / data.reduce((s, d) => s + d.value, 0)) * 100).toFixed(1)}%`}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `${value.toLocaleString('de-DE')} €`} />
          </PieChart>
        </ResponsiveContainer>

        <div className="grid grid-cols-2 gap-3 mt-4">
          {data.map(item => (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }} />
              <div className="flex-1">
                <p className="text-xs text-slate-600">{item.name}</p>
                <p className="text-sm font-semibold">{item.value.toLocaleString('de-DE')} €</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}