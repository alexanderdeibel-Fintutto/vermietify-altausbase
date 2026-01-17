import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { AlertCircle } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function VacancyCostCalculator() {
  const [values, setValues] = useState({
    monthlyRent: 850,
    vacancyMonths: 2,
    renovationCost: 1200
  });

  const totalLoss = (values.monthlyRent * values.vacancyMonths) + values.renovationCost;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          Leerstandskosten
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <VfInput
            label="Monatliche Miete (€)"
            type="number"
            value={values.monthlyRent}
            onChange={(e) => setValues({ ...values, monthlyRent: Number(e.target.value) })}
          />

          <VfInput
            label="Leerstandsdauer (Monate)"
            type="number"
            value={values.vacancyMonths}
            onChange={(e) => setValues({ ...values, vacancyMonths: Number(e.target.value) })}
          />

          <VfInput
            label="Renovierungskosten (€)"
            type="number"
            value={values.renovationCost}
            onChange={(e) => setValues({ ...values, renovationCost: Number(e.target.value) })}
          />

          <div className="p-4 bg-[var(--vf-error-50)] rounded-lg mt-6">
            <div className="text-sm text-[var(--vf-error-700)] mb-2">Gesamtkosten</div>
            <CurrencyDisplay amount={totalLoss} className="text-3xl font-bold text-[var(--vf-error-600)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}