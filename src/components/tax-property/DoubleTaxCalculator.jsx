import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Globe, TrendingDown } from 'lucide-react';

export default function DoubleTaxCalculator() {
  const [income, setIncome] = useState('');
  const [country, setCountry] = useState('CH');

  const taxRates = {
    CH: { rate: 0.25, method: 'Anrechnungsmethode' },
    AT: { rate: 0.30, method: 'Anrechnungsmethode' },
    FR: { rate: 0.35, method: 'Anrechnungsmethode' },
    NL: { rate: 0.28, method: 'Freistellungsmethode' }
  };

  const calculate = () => {
    if (!income) return { foreign: 0, german: 0, relief: 0 };
    const amount = parseFloat(income);
    const foreignTax = amount * taxRates[country].rate;
    const germanTax = amount * 0.42; // German tax rate
    const relief = Math.min(foreignTax, germanTax); // Tax credit
    
    return {
      foreign: foreignTax,
      german: germanTax - relief,
      relief: relief
    };
  };

  const result = calculate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="w-5 h-5" />
          DBA-Rechner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="number"
          placeholder="Ausländische Einkünfte €"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
        />
        
        <Select value={country} onValueChange={setCountry}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
            <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
            <SelectItem value="FR">🇫🇷 Frankreich</SelectItem>
            <SelectItem value="NL">🇳🇱 Niederlande</SelectItem>
          </SelectContent>
        </Select>

        <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-slate-600">Auslandssteuer:</span>
            <span className="font-semibold">{result.foreign.toLocaleString('de-DE')} €</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-600">Deutsche Steuer:</span>
            <span className="font-semibold">{result.german.toLocaleString('de-DE')} €</span>
          </div>
          <div className="flex justify-between pt-2 border-t">
            <span className="font-semibold flex items-center gap-1">
              <TrendingDown className="w-4 h-4 text-green-600" />
              Anrechnung:
            </span>
            <span className="font-bold text-green-600">{result.relief.toLocaleString('de-DE')} €</span>
          </div>
        </div>

        <p className="text-xs text-slate-600">
          Methode: {taxRates[country].method}
        </p>
      </CardContent>
    </Card>
  );
}