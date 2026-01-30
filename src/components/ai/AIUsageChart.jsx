import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { base44 } from '@/api/base44Client';

export default function AIUsageChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChartData();
  }, []);

  async function loadChartData() {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      
      const logs = await base44.entities.AIUsageLog.filter({
        created_date: { $gte: thirtyDaysAgo.toISOString() }
      });

      const dailyStats = {};
      
      logs.forEach(log => {
        const date = new Date(log.created_date).toISOString().split('T')[0];
        if (!dailyStats[date]) {
          dailyStats[date] = {
            date,
            cost: 0,
            costWithoutCache: 0,
            requests: 0,
          };
        }
        dailyStats[date].cost += log.cost_eur || 0;
        dailyStats[date].costWithoutCache += log.cost_without_cache_eur || 0;
        dailyStats[date].requests += 1;
      });

      const chartData = Object.values(dailyStats)
        .sort((a, b) => a.date.localeCompare(b.date))
        .map(d => ({
          date: new Date(d.date).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
          'Mit Cache': Math.round(d.cost * 100) / 100,
          'Ohne Cache': Math.round(d.costWithoutCache * 100) / 100,
          Anfragen: d.requests,
        }));

      setData(chartData);
    } catch (e) {
      console.error('Failed to load chart data:', e);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">Lade Diagramm...</div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>📈 Nutzungsverlauf (30 Tage)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            Noch keine Nutzungsdaten vorhanden
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>📈 Nutzungsverlauf (30 Tage)</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" label={{ value: 'Kosten (€)', angle: -90, position: 'insideLeft' }} />
            <YAxis yAxisId="right" orientation="right" label={{ value: 'Anfragen', angle: 90, position: 'insideRight' }} />
            <Tooltip />
            <Legend />
            <Line yAxisId="left" type="monotone" dataKey="Mit Cache" stroke="#10B981" strokeWidth={2} />
            <Line yAxisId="left" type="monotone" dataKey="Ohne Cache" stroke="#EF4444" strokeDasharray="5 5" />
            <Line yAxisId="right" type="monotone" dataKey="Anfragen" stroke="#6366F1" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 text-sm text-muted-foreground text-center">
          Grün = Tatsächliche Kosten mit Caching | Rot (gestrichelt) = Kosten ohne Caching
        </div>
      </CardContent>
    </Card>
  );
}