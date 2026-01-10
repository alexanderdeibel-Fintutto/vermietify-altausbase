import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calculator } from 'lucide-react';

export default function TaxProjectionCalculator() {
  const { data: projection } = useQuery({
    queryKey: ['taxProjection'],
    queryFn: async () => {
      const response = await base44.functions.invoke('projectAnnualTax', {});
      return response.data;
    }
  });

  if (!projection) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Steuer-Hochrechnung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="p-4 bg-blue-50 rounded-lg text-center">
          <p className="text-sm text-slate-600">Erwartete Steuerlast {new Date().getFullYear()}</p>
          <p className="text-3xl font-bold text-blue-900">{projection.total_tax.toLocaleString('de-DE')}€</p>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={projection.monthly}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="tax" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}