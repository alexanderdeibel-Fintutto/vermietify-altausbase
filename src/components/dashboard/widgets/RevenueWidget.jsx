import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Euro } from 'lucide-react';

export default function RevenueWidget() {
  const { data: payments = [] } = useQuery({
    queryKey: ['revenue-widget'],
    queryFn: async () => {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const all = await base44.entities.Payment.list();
      return all.filter(p => p.payment_date && p.payment_date.startsWith(currentMonth));
    }
  });

  const totalRevenue = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Euro className="w-5 h-5" />
          Einnahmen (Monat)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center">
          <p className="text-4xl font-bold text-green-600">{totalRevenue.toFixed(2)}€</p>
          <p className="text-sm text-slate-600 mt-1">{payments.length} Zahlungen</p>
        </div>
      </CardContent>
    </Card>
  );
}