import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Wrench, TrendingUp } from 'lucide-react';

export default function RenovationROI() {
  const [renovationCost, setRenovationCost] = useState('');
  const [rentIncrease, setRentIncrease] = useState('');
  const [valueIncrease, setValueIncrease] = useState('');

  const calculate = () => {
    const cost = parseFloat(renovationCost) || 0;
    const monthlyRent = parseFloat(rentIncrease) || 0;
    const value = parseFloat(valueIncrease) || 0;
    
    const annualRent = monthlyRent * 12;
    const paybackYears = cost > 0 ? cost / annualRent : 0;
    const totalROI = ((annualRent * 10 + value - cost) / cost) * 100;
    
    return { paybackYears, totalROI, annualRent };
  };

  const result = calculate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wrench className="w-5 h-5" />
          Modernisierungs-ROI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-xs font-semibold block mb-1">Modernisierungskosten</label>
          <Input
            type="number"
            placeholder="15000"
            value={renovationCost}
            onChange={(e) => setRenovationCost(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Mieterhöhung/Monat</label>
          <Input
            type="number"
            placeholder="50"
            value={rentIncrease}
            onChange={(e) => setRentIncrease(e.target.value)}
          />
        </div>

        <div>
          <label className="text-xs font-semibold block mb-1">Wertsteigerung</label>
          <Input
            type="number"
            placeholder="10000"
            value={valueIncrease}
            onChange={(e) => setValueIncrease(e.target.value)}
          />
        </div>

        <div className="space-y-2 p-3 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg">
          <div className="flex justify-between">
            <span className="text-sm">Amortisation:</span>
            <Badge className="bg-blue-600">{result.paybackYears.toFixed(1)} Jahre</Badge>
          </div>
          <div className="flex justify-between">
            <span className="text-sm">ROI (10 Jahre):</span>
            <Badge className={result.totalROI > 50 ? 'bg-green-600' : 'bg-orange-600'}>
              {result.totalROI.toFixed(1)}%
            </Badge>
          </div>
          <div className="flex justify-between text-sm pt-2 border-t">
            <span className="text-slate-700">Mehrertrag p.a.:</span>
            <span className="font-bold text-green-600">
              +{result.annualRent.toLocaleString('de-DE')} €
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}