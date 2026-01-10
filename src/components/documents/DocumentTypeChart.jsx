import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { FileText } from 'lucide-react';

export default function DocumentTypeChart({ data }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <FileText className="w-5 h-5" />
          Top Dokumenttypen
        </CardTitle>
      </CardHeader>
      <CardContent>
        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="type" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1e293b" />
            </BarChart>
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