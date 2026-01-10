import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Archive } from 'lucide-react';

export default function ArchivingChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Archive className="w-5 h-5" />
          Archivierungshäufigkeit (90 Tage)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="count" fill="#cbd5e1" stroke="#1e293b" />
            </AreaChart>
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