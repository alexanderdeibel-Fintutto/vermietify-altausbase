import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Landmark } from 'lucide-react';

export default function PropertyTaxCalculator() {
  const [area, setArea] = useState('');
  const [value, setValue] = useState('');
  const [state, setState] = useState('NW');

  const hebesaetze = {
    NW: 550,
    BY: 535,
    BE: 810,
    HH: 540,
    HE: 500
  };

  const calculate = () => {
    const sqm = parseFloat(area) || 0;
    const propertyValue = parseFloat(value) || 0;
    
    // Simplified calculation
    const einheitswert = sqm * 50; // Simplified
    const grundsteuer = (einheitswert * 0.0035 * hebesaetze[state]) / 100;
    
    return grundsteuer;
  };

  const annualTax = calculate();

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Landmark className="w-5 h-5" />
          Grundsteuer-Rechner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="grid grid-cols-2 gap-2">
          <Input
            type="number"
            placeholder="Fläche m²"
            value={area}
            onChange={(e) => setArea(e.target.value)}
          />
          <Input
            type="number"
            placeholder="Wert €"
            value={value}
            onChange={(e) => setValue(e.target.value)}
          />
        </div>

        <Select value={state} onValueChange={setState}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="NW">Nordrhein-Westfalen</SelectItem>
            <SelectItem value="BY">Bayern</SelectItem>
            <SelectItem value="BE">Berlin</SelectItem>
            <SelectItem value="HH">Hamburg</SelectItem>
            <SelectItem value="HE">Hessen</SelectItem>
          </SelectContent>
        </Select>

        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900 mb-1">Jährliche Grundsteuer:</p>
          <p className="text-3xl font-bold text-blue-900">{annualTax.toLocaleString('de-DE')} €</p>
          <p className="text-xs text-slate-600 mt-2">Hebesatz: {hebesaetze[state]}%</p>
        </div>
      </CardContent>
    </Card>
  );
}