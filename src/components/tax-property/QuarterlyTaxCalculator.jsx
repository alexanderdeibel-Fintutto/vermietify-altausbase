import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, Calculator } from 'lucide-react';

export default function QuarterlyTaxCalculator() {
  const [estimatedIncome, setEstimatedIncome] = useState('');

  const calculateQuarterly = () => {
    if (!estimatedIncome) return 0;
    const annual = parseFloat(estimatedIncome);
    const taxRate = annual > 60000 ? 0.42 : annual > 30000 ? 0.30 : 0.20;
    return (annual * taxRate) / 4;
  };

  const quarterly = calculateQuarterly();
  const quarters = [
    { q: 'Q1', due: '10.03.2026' },
    { q: 'Q2', due: '10.06.2026' },
    { q: 'Q3', due: '10.09.2026' },
    { q: 'Q4', due: '10.12.2026' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          Vorauszahlungen
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-semibold block mb-1">Geschätztes Jahreseinkommen</label>
          <Input
            type="number"
            placeholder="80000"
            value={estimatedIncome}
            onChange={(e) => setEstimatedIncome(e.target.value)}
          />
        </div>

        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900 mb-1">Vierteljährliche Vorauszahlung:</p>
          <p className="text-2xl font-bold text-blue-900">{quarterly.toLocaleString('de-DE')} €</p>
        </div>

        <div className="space-y-2">
          {quarters.map(q => (
            <div key={q.q} className="flex items-center justify-between p-2 bg-slate-50 rounded">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-semibold">{q.q}</span>
              </div>
              <div className="text-right">
                <p className="text-sm font-bold">{quarterly.toLocaleString('de-DE')} €</p>
                <p className="text-xs text-slate-600">Fällig: {q.due}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}