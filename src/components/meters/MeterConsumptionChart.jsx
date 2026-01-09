import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

export default function MeterConsumptionChart({ meters, selectedBuilding }) {
  const [chartType, setChartType] = useState('bar');
  const [timeRange, setTimeRange] = useState('month');

  // Calculate consumption data (mock for now - would need historical readings)
  const getChartData = () => {
    const metersByType = meters.reduce((acc, meter) => {
      if (!meter.current_reading) return acc;
      const type = meter.meter_type || 'other';
      if (!acc[type]) {
        acc[type] = {
          total: 0,
          count: 0,
          unit: meter.unit || ''
        };
      }
      acc[type].total += meter.current_reading;
      acc[type].count += 1;
      return acc;
    }, {});

    return Object.entries(metersByType).map(([type, data]) => ({
      name: type === 'electricity' ? 'Strom' :
            type === 'water' ? 'Wasser' :
            type === 'gas' ? 'Gas' :
            type === 'heating' ? 'Heizung' : 'Sonstige',
      value: Math.round(data.total / data.count),
      count: data.count,
      unit: data.unit
    }));
  };

  const chartData = getChartData();

  // Calculate trends
  const totalConsumption = chartData.reduce((acc, d) => acc + d.value, 0);
  const avgPerMeter = meters.length > 0 ? totalConsumption / meters.length : 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Gesamtverbrauch</p>
                <p className="text-2xl font-bold">{totalConsumption.toLocaleString('de-DE')}</p>
              </div>
              <TrendingUp className="w-8 h-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Durchschnitt/Zähler</p>
                <p className="text-2xl font-bold">{Math.round(avgPerMeter).toLocaleString('de-DE')}</p>
              </div>
              <Calendar className="w-8 h-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Erfasste Zähler</p>
                <p className="text-2xl font-bold">{meters.filter(m => m.current_reading).length}</p>
              </div>
              <Badge className="bg-blue-600">{meters.length} gesamt</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Verbrauch nach Zählertyp</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setChartType('bar')}
                className={`px-3 py-1 rounded text-sm ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
              >
                Balken
              </button>
              <button
                onClick={() => setChartType('line')}
                className={`px-3 py-1 rounded text-sm ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-slate-100'}`}
              >
                Linie
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              {chartType === 'bar' ? (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" fill="#3b82f6" name="Durchschnittswert" />
                </BarChart>
              ) : (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={2} name="Durchschnittswert" />
                </LineChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-slate-600">
              Keine Verbrauchsdaten verfügbar
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Detaillierte Aufschlüsselung</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {chartData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-sm text-slate-600">{item.count} Zähler</p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{item.value.toLocaleString('de-DE')}</p>
                  <p className="text-xs text-slate-600">{item.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}