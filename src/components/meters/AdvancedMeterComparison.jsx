import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';

export default function AdvancedMeterComparison({ buildingId }) {
  const [selectedMeters, setSelectedMeters] = useState([]);
  const [timeRange, setTimeRange] = useState('6months');
  const [chartType, setChartType] = useState('line');

  const { data: meters = [] } = useQuery({
    queryKey: ['meters', buildingId],
    queryFn: () => base44.entities.Meter.filter(
      buildingId ? { building_id: buildingId } : {},
      'location',
      100
    )
  });

  const { data: readings = [] } = useQuery({
    queryKey: ['meterReadings', selectedMeters, timeRange],
    queryFn: async () => {
      if (selectedMeters.length === 0) return [];
      
      const allReadings = await base44.entities.MeterReading.filter(
        { meter_id: { $in: selectedMeters } },
        '-reading_date',
        500
      );

      const monthsBack = timeRange === '3months' ? 3 : 
                         timeRange === '6months' ? 6 : 12;
      const cutoffDate = new Date();
      cutoffDate.setMonth(cutoffDate.getMonth() - monthsBack);

      return allReadings.filter(r => new Date(r.reading_date) >= cutoffDate);
    },
    enabled: selectedMeters.length > 0
  });

  // Prepare chart data
  const chartData = React.useMemo(() => {
    if (readings.length === 0) return [];

    // Group readings by month
    const dataByMonth = {};
    
    readings.forEach(reading => {
      const meter = meters.find(m => m.id === reading.meter_id);
      const date = new Date(reading.reading_date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!dataByMonth[monthKey]) {
        dataByMonth[monthKey] = { month: monthKey };
      }
      
      const meterKey = meter?.meter_number || reading.meter_id;
      if (!dataByMonth[monthKey][meterKey]) {
        dataByMonth[monthKey][meterKey] = [];
      }
      dataByMonth[monthKey][meterKey].push(reading.consumption || 0);
    });

    // Average values per month
    return Object.entries(dataByMonth)
      .map(([month, data]) => {
        const result = { month };
        Object.keys(data).forEach(key => {
          if (key !== 'month' && Array.isArray(data[key])) {
            result[key] = Math.round(
              data[key].reduce((a, b) => a + b, 0) / data[key].length
            );
          }
        });
        return result;
      })
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [readings, meters]);

  const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  const toggleMeter = (meterId) => {
    setSelectedMeters(prev => 
      prev.includes(meterId) 
        ? prev.filter(id => id !== meterId)
        : [...prev, meterId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Meter Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Zähler auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {meters.slice(0, 20).map(meter => (
              <button
                key={meter.id}
                onClick={() => toggleMeter(meter.id)}
                className={`p-3 rounded-lg border-2 text-left transition-all ${
                  selectedMeters.includes(meter.id)
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <p className="font-semibold text-sm">{meter.meter_number}</p>
                <p className="text-xs text-slate-600">{meter.location}</p>
                <Badge variant="outline" className="text-xs mt-1">
                  {meter.meter_type}
                </Badge>
              </button>
            ))}
          </div>
          {meters.length > 20 && (
            <p className="text-xs text-slate-600 mt-3">
              Zeige erste 20 Zähler. Nutze Filter für mehr.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Controls */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex gap-2">
              <Button
                variant={timeRange === '3months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('3months')}
              >
                3 Monate
              </Button>
              <Button
                variant={timeRange === '6months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('6months')}
              >
                6 Monate
              </Button>
              <Button
                variant={timeRange === '12months' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setTimeRange('12months')}
              >
                12 Monate
              </Button>
            </div>

            <div className="flex gap-2">
              <Button
                variant={chartType === 'line' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('line')}
              >
                Linie
              </Button>
              <Button
                variant={chartType === 'area' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('area')}
              >
                Fläche
              </Button>
              <Button
                variant={chartType === 'bar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setChartType('bar')}
              >
                Balken
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Verbrauchsverlauf
          </CardTitle>
        </CardHeader>
        <CardContent>
          {chartData.length > 0 && selectedMeters.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              {chartType === 'line' ? (
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedMeters.map((meterId, idx) => {
                    const meter = meters.find(m => m.id === meterId);
                    return (
                      <Line
                        key={meterId}
                        type="monotone"
                        dataKey={meter?.meter_number || meterId}
                        stroke={colors[idx % colors.length]}
                        strokeWidth={2}
                        name={`${meter?.meter_number} (${meter?.location})`}
                      />
                    );
                  })}
                </LineChart>
              ) : chartType === 'area' ? (
                <AreaChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedMeters.map((meterId, idx) => {
                    const meter = meters.find(m => m.id === meterId);
                    return (
                      <Area
                        key={meterId}
                        type="monotone"
                        dataKey={meter?.meter_number || meterId}
                        fill={colors[idx % colors.length]}
                        stroke={colors[idx % colors.length]}
                        fillOpacity={0.6}
                        name={`${meter?.meter_number} (${meter?.location})`}
                      />
                    );
                  })}
                </AreaChart>
              ) : (
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  {selectedMeters.map((meterId, idx) => {
                    const meter = meters.find(m => m.id === meterId);
                    return (
                      <Bar
                        key={meterId}
                        dataKey={meter?.meter_number || meterId}
                        fill={colors[idx % colors.length]}
                        name={`${meter?.meter_number} (${meter?.location})`}
                      />
                    );
                  })}
                </BarChart>
              )}
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-16 text-slate-600">
              <Calendar className="w-12 h-12 mx-auto mb-3 text-slate-400" />
              <p>Wählen Sie Zähler aus, um Vergleiche zu sehen</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistics Table */}
      {selectedMeters.length > 0 && chartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Statistik</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2">Zähler</th>
                    <th className="text-right py-2">Min</th>
                    <th className="text-right py-2">Ø</th>
                    <th className="text-right py-2">Max</th>
                    <th className="text-right py-2">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedMeters.map(meterId => {
                    const meter = meters.find(m => m.id === meterId);
                    const meterKey = meter?.meter_number || meterId;
                    const values = chartData
                      .map(d => d[meterKey])
                      .filter(v => v !== undefined);
                    
                    if (values.length === 0) return null;

                    const min = Math.min(...values);
                    const max = Math.max(...values);
                    const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
                    const trend = values.length >= 2 
                      ? ((values[values.length - 1] - values[0]) / values[0] * 100)
                      : 0;

                    return (
                      <tr key={meterId} className="border-b">
                        <td className="py-2">
                          <p className="font-semibold">{meter?.meter_number}</p>
                          <p className="text-xs text-slate-600">{meter?.location}</p>
                        </td>
                        <td className="text-right py-2">{min}</td>
                        <td className="text-right py-2 font-semibold">{avg}</td>
                        <td className="text-right py-2">{max}</td>
                        <td className="text-right py-2">
                          <Badge className={
                            trend > 10 ? 'bg-red-100 text-red-800' :
                            trend < -10 ? 'bg-green-100 text-green-800' :
                            'bg-blue-100 text-blue-800'
                          }>
                            {trend > 0 ? '+' : ''}{trend.toFixed(1)}%
                          </Badge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}