import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from 'lucide-react';

export default function PerformanceChart({ assetId, days = 90 }) {
  const { data: performanceData, isLoading } = useQuery({
    queryKey: ['assetPerformance', assetId, days],
    queryFn: async () => {
      const allPerformance = await base44.entities.AssetPerformanceHistory.filter(
        { asset_id: assetId },
        '-date',
        365
      );

      // Zeitfilter anwenden
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      return allPerformance
        .filter(p => new Date(p.date) >= cutoffDate)
        .reverse() // Chronologische Reihenfolge
        .map(p => ({
          date: new Date(p.date).toLocaleDateString('de-DE', { month: 'short', day: 'numeric' }),
          value: p.value_per_unit,
          totalValue: p.total_value,
          change: p.change_percent
        }));
    },
    staleTime: 60 * 60 * 1000, // 1 Stunde
    cacheTime: 2 * 60 * 60 * 1000, // 2 Stunden
    enabled: !!assetId
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6 flex items-center justify-center h-64">
          <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    );
  }

  if (!performanceData || performanceData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6 text-center h-64 flex items-center justify-center">
          <p className="text-sm font-light text-slate-500">Keine Performance-Daten verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  const minValue = Math.min(...performanceData.map(p => p.value));
  const maxValue = Math.max(...performanceData.map(p => p.value));
  const avgValue = performanceData.reduce((sum, p) => sum + p.value, 0) / performanceData.length;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-light">
          Performance ({days} Tage)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={performanceData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="date" 
              stroke="#999"
              style={{ fontSize: '12px' }}
            />
            <YAxis 
              stroke="#999"
              style={{ fontSize: '12px' }}
              label={{ value: '€', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '8px',
                fontSize: '12px'
              }}
              formatter={(value) => `€${value.toFixed(2)}`}
              labelStyle={{ color: '#333' }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#1e293b"
              dot={false}
              name="Kurs pro Einheit"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mt-6">
          <div className="text-center">
            <p className="text-xs font-light text-slate-600">Min</p>
            <p className="text-lg font-light text-slate-900">
              €{minValue.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-light text-slate-600">Ø</p>
            <p className="text-lg font-light text-slate-900">
              €{avgValue.toFixed(2)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-xs font-light text-slate-600">Max</p>
            <p className="text-lg font-light text-slate-900">
              €{maxValue.toFixed(2)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}