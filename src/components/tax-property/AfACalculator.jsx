import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calculator, TrendingDown } from 'lucide-react';

export default function AfACalculator() {
  const [purchasePrice, setPurchasePrice] = useState('');
  const [constructionYear, setConstructionYear] = useState('');
  const [afaType, setAfaType] = useState('linear');

  const calculateAfa = () => {
    if (!purchasePrice) return 0;
    const price = parseFloat(purchasePrice);
    const year = parseInt(constructionYear);
    const currentYear = new Date().getFullYear();
    
    // Simplified AfA calculation
    let rate = 0.02; // 2% linear for buildings after 1925
    if (year && year < 1925) rate = 0.025; // 2.5% for older buildings
    if (afaType === 'degressive') rate = 0.03; // 3% degressive (simplified)
    
    return price * rate;
  };

  const annualAfa = calculateAfa();
  const taxSavings = annualAfa * 0.42; // Assuming 42% tax rate

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Calculator className="w-4 h-4" />
          AfA-Rechner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <label className="text-sm font-semibold block mb-1">Kaufpreis (Gebäude)</label>
          <Input
            type="number"
            placeholder="250000"
            value={purchasePrice}
            onChange={(e) => setPurchasePrice(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1">Baujahr</label>
          <Input
            type="number"
            placeholder="1990"
            value={constructionYear}
            onChange={(e) => setConstructionYear(e.target.value)}
          />
        </div>

        <div>
          <label className="text-sm font-semibold block mb-1">AfA-Methode</label>
          <Select value={afaType} onValueChange={setAfaType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="linear">Linear 2%</SelectItem>
              <SelectItem value="degressive">Degressiv 3%</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="p-4 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200">
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-slate-700">Jährliche AfA:</span>
              <span className="text-lg font-bold text-blue-900">
                {annualAfa.toLocaleString('de-DE')} €
              </span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-blue-200">
              <span className="text-sm font-semibold text-slate-700 flex items-center gap-1">
                <TrendingDown className="w-4 h-4 text-green-600" />
                Steuerersparnis:
              </span>
              <span className="text-lg font-bold text-green-600">
                {taxSavings.toLocaleString('de-DE')} €
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}