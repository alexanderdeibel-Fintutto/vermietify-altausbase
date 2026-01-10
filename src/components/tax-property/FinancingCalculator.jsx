import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Calculator } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FinancingCalculator() {
  const [loanAmount, setLoanAmount] = useState('250000');
  const [interestRate, setInterestRate] = useState('3.5');
  const [years, setYears] = useState('30');

  const calculateAmortization = () => {
    const P = parseFloat(loanAmount) || 0;
    const r = (parseFloat(interestRate) || 0) / 100 / 12;
    const n = (parseInt(years) || 0) * 12;

    const monthlyPayment = P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    
    const schedule = [];
    let remaining = P;
    
    for (let year = 0; year <= parseInt(years); year += 5) {
      const month = year * 12;
      for (let i = 0; i < month; i++) {
        const interest = remaining * r;
        const principal = monthlyPayment - interest;
        remaining -= principal;
      }
      schedule.push({
        year,
        remaining: Math.max(0, remaining),
        paid: P - remaining
      });
    }

    return { monthlyPayment, totalCost: monthlyPayment * n, schedule };
  };

  const result = calculateAmortization();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Finanzierungsrechner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          <Input
            type="number"
            placeholder="Darlehensbetrag"
            value={loanAmount}
            onChange={(e) => setLoanAmount(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Zinssatz %"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Laufzeit Jahre"
            value={years}
            onChange={(e) => setYears(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-900">Monatliche Rate</p>
            <p className="text-xl font-bold text-blue-900">
              {result.monthlyPayment.toLocaleString('de-DE')} €
            </p>
          </div>
          <div className="p-3 bg-purple-50 rounded-lg">
            <p className="text-xs text-purple-900">Gesamtkosten</p>
            <p className="text-xl font-bold text-purple-900">
              {result.totalCost.toLocaleString('de-DE')} €
            </p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={result.schedule}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="year" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="remaining" stroke="#ef4444" name="Restschuld" />
            <Line type="monotone" dataKey="paid" stroke="#10b981" name="Getilgt" />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}