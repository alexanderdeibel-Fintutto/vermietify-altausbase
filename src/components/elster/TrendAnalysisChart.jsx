import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, Building2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export default function TrendAnalysisChart({ buildingId, formType = 'ANLAGE_V' }) {
  const { data: submissions = [] } = useQuery({
    queryKey: ['elster-trend', buildingId, formType],
    queryFn: async () => {
      const query = { tax_form_type: formType, status: 'ACCEPTED' };
      if (buildingId) query.building_id = buildingId;
      return base44.entities.ElsterSubmission.filter(query);
    }
  });

  const trendData = submissions
    .sort((a, b) => a.tax_year - b.tax_year)
    .map(sub => ({
      year: sub.tax_year,
      income: sub.form_data?.income_rent || 0,
      expenses: sub.form_data?.expense_total || 0,
      afa: sub.form_data?.afa_amount || 0,
      result: (sub.form_data?.income_rent || 0) - (sub.form_data?.expense_total || 0) - (sub.form_data?.afa_amount || 0)
    }));

  if (trendData.length < 2) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <TrendingUp className="w-4 h-4" />
            Mehrjahres-Trend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-600 text-center py-6">
            Mindestens 2 akzeptierte Submissions erforderlich
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <TrendingUp className="w-4 h-4" />
          Mehrjahres-Trend
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `${v / 1000}k`} />
              <Tooltip 
                formatter={(value) => value.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                contentStyle={{ 
                  backgroundColor: 'white', 
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" name="Einnahmen" strokeWidth={2} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" name="Ausgaben" strokeWidth={2} />
              <Line type="monotone" dataKey="result" stroke="#3b82f6" name="Ergebnis" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}