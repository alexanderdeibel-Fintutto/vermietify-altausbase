import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { VfInput } from '@/components/shared/VfInput';
import { Calculator } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function InvestmentPlanner() {
  const [values, setValues] = useState({
    purchasePrice: 300000,
    downPayment: 60000,
    interestRate: 3.5,
    loanTerm: 20
  });

  const loanAmount = values.purchasePrice - values.downPayment;
  const monthlyRate = values.interestRate / 100 / 12;
  const numPayments = values.loanTerm * 12;
  const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) / (Math.pow(1 + monthlyRate, numPayments) - 1);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          Investitionsrechner
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <VfInput
            label="Kaufpreis (€)"
            type="number"
            value={values.purchasePrice}
            onChange={(e) => setValues({ ...values, purchasePrice: Number(e.target.value) })}
          />

          <VfInput
            label="Eigenkapital (€)"
            type="number"
            value={values.downPayment}
            onChange={(e) => setValues({ ...values, downPayment: Number(e.target.value) })}
          />

          <div className="grid md:grid-cols-2 gap-4">
            <VfInput
              label="Zinssatz (%)"
              type="number"
              step="0.1"
              value={values.interestRate}
              onChange={(e) => setValues({ ...values, interestRate: Number(e.target.value) })}
            />
            <VfInput
              label="Laufzeit (Jahre)"
              type="number"
              value={values.loanTerm}
              onChange={(e) => setValues({ ...values, loanTerm: Number(e.target.value) })}
            />
          </div>

          <div className="p-4 bg-[var(--vf-primary-50)] rounded-lg mt-6">
            <div className="text-sm text-[var(--vf-primary-700)] mb-2">Monatliche Rate</div>
            <CurrencyDisplay amount={monthlyPayment} className="text-3xl font-bold text-[var(--vf-primary-600)]" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}