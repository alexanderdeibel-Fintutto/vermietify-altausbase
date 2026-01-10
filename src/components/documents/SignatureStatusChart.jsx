import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { PenTool } from 'lucide-react';

export default function SignatureStatusChart({ data }) {
  const chartData = data
    ? [
        {
          status: 'Entwurf',
          count: data.draft
        },
        {
          status: 'Versendet',
          count: data.sent
        },
        {
          status: 'In Bearbeitung',
          count: data.in_progress
        },
        {
          status: 'Abgeschlossen',
          count: data.completed
        },
        {
          status: 'Abgelehnt',
          count: data.rejected
        }
      ]
    : [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <PenTool className="w-5 h-5" />
          Signaturanfragen Status
        </CardTitle>
      </CardHeader>
      <CardContent>
        {chartData.some(d => d.count > 0) ? (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="status" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#1e293b" />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-300 flex items-center justify-center text-slate-500">
            Keine Signaturanfragen vorhanden
          </div>
        )}
      </CardContent>
    </Card>
  );
}