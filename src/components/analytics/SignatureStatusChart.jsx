import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { Badge } from '@/components/ui/badge';

const COLORS = {
  completed: '#10b981',
  pending: '#f59e0b',
  rejected: '#ef4444'
};

export default function SignatureStatusChart({ signatureStats }) {
  const data = [
    { name: 'Abgeschlossen', value: signatureStats.completed, color: COLORS.completed },
    { name: 'Ausstehend', value: signatureStats.pending, color: COLORS.pending },
    { name: 'Abgelehnt', value: signatureStats.rejected, color: COLORS.rejected }
  ].filter(d => d.value > 0);

  const completionRate = signatureStats.total > 0
    ? ((signatureStats.completed / signatureStats.total) * 100).toFixed(1)
    : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Signatur-Status Übersicht</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-3 gap-2 pt-4 border-t">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{signatureStats.completed}</p>
              <p className="text-xs text-slate-600">Abgeschlossen</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-amber-600">{signatureStats.pending}</p>
              <p className="text-xs text-slate-600">Ausstehend</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{signatureStats.rejected}</p>
              <p className="text-xs text-slate-600">Abgelehnt</p>
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-3">
            <p className="text-sm font-medium text-blue-900">
              Abschlussquote: <span className="text-lg">{completionRate}%</span>
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}