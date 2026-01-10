import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Badge } from '@/components/ui/badge';

export default function TemplateUsageChart({ templateUsage, templates }) {
  const chartData = templateUsage.map(usage => {
    const template = templates?.find(t => t.id === usage.template_id);
    return {
      ...usage,
      name: template?.name || usage.template_id.slice(0, 8)
    };
  });

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <p className="text-center text-slate-500 text-sm">Keine Template-Nutzungsdaten verfügbar</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Meistgenutzte Templates</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" />
            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="count" fill="#06b6d4" name="Verwendungen" />
          </BarChart>
        </ResponsiveContainer>

        <div className="mt-4 space-y-2">
          {chartData.slice(0, 5).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-lg">
              <span className="text-sm text-slate-900">{item.name}</span>
              <Badge className="bg-cyan-100 text-cyan-700">{item.count}x</Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}