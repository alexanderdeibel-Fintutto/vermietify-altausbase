import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

export default function DocumentActivityChart({ dailyData }) {
  const chartData = dailyData.map(d => ({
    ...d,
    date: format(parseISO(d.date), 'dd.MM', { locale: de }),
    document_created: d.document_created || 0,
    signature_sent: d.signature_sent || 0,
    batch_upload: d.batch_upload || 0
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Aktivität der letzten 30 Tage</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis />
            <Tooltip
              contentStyle={{
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: '6px'
              }}
            />
            <Legend />
            <Bar dataKey="document_created" fill="#3b82f6" name="Dokumente" />
            <Bar dataKey="signature_sent" fill="#8b5cf6" name="Signaturen" />
            <Bar dataKey="batch_upload" fill="#10b981" name="Batch Upload" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}