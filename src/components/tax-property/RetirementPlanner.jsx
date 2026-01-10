import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Landmark } from 'lucide-react';

export default function RetirementPlanner() {
  const [currentAge, setCurrentAge] = useState('35');
  const [retirementAge, setRetirementAge] = useState('67');
  const [monthlyExpense, setMonthlyExpense] = useState('3000');

  const calculate = () => {
    const years = parseInt(retirementAge) - parseInt(currentAge);
    const monthlyExp = parseFloat(monthlyExpense) || 0;
    const expectedLife = 85;
    const retirementYears = expectedLife - parseInt(retirementAge);
    
    const totalNeeded = monthlyExp * 12 * retirementYears;
    const monthlyToSave = totalNeeded / (years * 12);
    
    return { totalNeeded, monthlyToSave, years, retirementYears };
  };

  const result = calculate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="w-5 h-5" />
          Altersvorsorge-Planung
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-semibold block mb-1">Aktuelles Alter</label>
            <Input
              type="number"
              value={currentAge}
              onChange={(e) => setCurrentAge(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs font-semibold block mb-1">Rentenalter</label>
            <Input
              type="number"
              value={retirementAge}
              onChange={(e) => setRetirementAge(e.target.value)}
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Monatliche Ausgaben (Rente)</label>
          <Input
            type="number"
            value={monthlyExpense}
            onChange={(e) => setMonthlyExpense(e.target.value)}
          />
        </div>

        <div className="space-y-2 p-3 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg">
          <div className="flex justify-between text-sm">
            <span className="text-slate-700">Benötigtes Kapital:</span>
            <span className="font-bold text-purple-900">
              {result.totalNeeded.toLocaleString('de-DE')} €
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-700">Mtl. Sparrate:</span>
            <span className="font-bold text-blue-900">
              {result.monthlyToSave.toLocaleString('de-DE')} €
            </span>
          </div>
          <div className="flex justify-between text-xs text-slate-600 pt-2 border-t">
            <span>{result.years} Jahre sparen</span>
            <span>{result.retirementYears} Jahre Rente</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}