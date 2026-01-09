import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, PieChart, Target, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function WealthWidget() {
  const wealthData = [
    { month: 'Jan', value: 150000 },
    { month: 'Feb', value: 155000 },
    { month: 'Mär', value: 152000 },
    { month: 'Apr', value: 160000 },
    { month: 'Mai', value: 165000 },
    { month: 'Jun', value: 170000 }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-light">Vermögensübersicht</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={wealthData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => `€${value.toLocaleString()}`} />
            <Line type="monotone" dataKey="value" stroke="#3b82f6" dot={false} strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-3 pt-4">
          <div className="text-center">
            <div className="text-sm text-slate-600">Gesamtvermögen</div>
            <div className="text-lg font-light">€170.000</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-600">Gewinn YTD</div>
            <div className="text-lg font-light text-green-600">+€20.000</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-slate-600">Rendite</div>
            <div className="text-lg font-light text-blue-600">+11.8%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}