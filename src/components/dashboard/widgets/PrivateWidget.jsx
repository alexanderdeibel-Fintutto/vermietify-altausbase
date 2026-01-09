import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Legend, ResponsiveContainer } from 'recharts';
import { Wallet, TrendingUp, Target } from 'lucide-react';

export default function PrivateWidget() {
  const assetAllocation = [
    { name: 'Immobilien', value: 45, color: '#8b5cf6' },
    { name: 'Wertpapiere', value: 30, color: '#3b82f6' },
    { name: 'Bargeld', value: 15, color: '#10b981' },
    { name: 'Sonstiges', value: 10, color: '#f59e0b' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base font-light">Persönliche Vermögensallokation</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ResponsiveContainer width="100%" height={200}>
          <PieChart>
            <Pie
              data={assetAllocation}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
            >
              {assetAllocation.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center">
            <Wallet className="w-4 h-4 mx-auto mb-1 text-slate-400" />
            <div className="text-sm text-slate-600">Vermögen</div>
            <div className="text-lg font-light">€250.000</div>
          </div>
          <div className="text-center">
            <TrendingUp className="w-4 h-4 mx-auto mb-1 text-green-600" />
            <div className="text-sm text-slate-600">Gewinn YTD</div>
            <div className="text-lg font-light text-green-600">+€32.500</div>
          </div>
          <div className="text-center">
            <Target className="w-4 h-4 mx-auto mb-1 text-blue-600" />
            <div className="text-sm text-slate-600">Ziel</div>
            <div className="text-lg font-light">€300.000</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}