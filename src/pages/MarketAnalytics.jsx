import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, MapPin } from 'lucide-react';

export default function MarketAnalyticsPage() {
  const marketData = [
    { city: 'Berlin', avgPrice: 5200, growth: '+4.2%', units: 24 },
    { city: 'Munich', avgPrice: 7800, growth: '+6.1%', units: 12 },
    { city: 'Hamburg', avgPrice: 5100, growth: '+2.8%', units: 6 },
  ];

  const demandData = [
    { type: '1-Zimmer', value: 28, color: '#3b82f6' },
    { type: '2-Zimmer', value: 34, color: '#10b981' },
    { type: '3-Zimmer', value: 24, color: '#f59e0b' },
    { type: '4+ Zimmer', value: 14, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">📊 Marktanalyse</h1>
        <p className="text-slate-600 mt-1">Markttrends und Wettbewerbsanalyse</p>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Marktpreise nach Stadt</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {marketData.map((data, idx) => (
              <div key={idx} className="p-3 border border-slate-200 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-slate-900 flex items-center gap-2"><MapPin className="w-4 h-4" /> {data.city}</h3>
                  <Badge className="bg-green-600">{data.growth}</Badge>
                </div>
                <p className="text-sm text-slate-600">Durchschnitts-Miete: €{data.avgPrice} • {data.units} Einheiten</p>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border border-slate-200">
          <CardHeader>
            <CardTitle>Nachfrage nach Größe</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={demandData} cx="50%" cy="50%" labelLine={false} label={({ type, value }) => `${type} ${value}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {demandData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="border border-slate-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5" /> Markt Trends</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={marketData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="city" />
              <YAxis />
              <Tooltip formatter={(value) => `€${value}`} />
              <Bar dataKey="avgPrice" fill="#3b82f6" name="Durchschnittspreis" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}