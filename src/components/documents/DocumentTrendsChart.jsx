import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp } from 'lucide-react';

export default function DocumentTrendsChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-5 h-5" />
          Dokumenterstellung (90 Tage)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#0f172a" strokeWidth={2} dot={{ fill: '#0f172a' }} />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-300 flex items-center justify-center text-slate-500">
            Keine Daten verfügbar
          </div>
        )}
      </CardContent>
    </Card>
  );
}