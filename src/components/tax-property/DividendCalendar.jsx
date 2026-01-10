import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, DollarSign } from 'lucide-react';

export default function DividendCalendar() {
  const dividends = [
    { stock: 'Siemens AG', amount: 420, ex_date: '2026-02-05', payment_date: '2026-02-10' },
    { stock: 'BMW AG', amount: 350, ex_date: '2026-03-12', payment_date: '2026-03-17' },
    { stock: 'SAP SE', amount: 280, ex_date: '2026-04-20', payment_date: '2026-04-25' },
    { stock: 'Deutsche Telekom', amount: 180, ex_date: '2026-05-08', payment_date: '2026-05-13' }
  ];

  const totalUpcoming = dividends.reduce((sum, d) => sum + d.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="w-5 h-5" />
          Dividenden-Kalender
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="p-3 bg-green-50 rounded-lg border border-green-200">
          <p className="text-sm text-green-900">Erwartete Dividenden (6 Monate)</p>
          <p className="text-3xl font-bold text-green-900">{totalUpcoming.toLocaleString('de-DE')} €</p>
        </div>

        <div className="space-y-2">
          {dividends.map((div, idx) => (
            <div key={idx} className="p-3 bg-slate-50 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-sm">{div.stock}</p>
                  <p className="text-xs text-slate-600">Ex-Tag: {div.ex_date}</p>
                </div>
                <Badge className="bg-green-600">{div.amount} €</Badge>
              </div>
              <div className="flex items-center gap-1 text-xs text-slate-600">
                <DollarSign className="w-3 h-3" />
                Zahlung: {div.payment_date}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}