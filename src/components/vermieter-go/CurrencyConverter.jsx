import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign } from 'lucide-react';

export default function CurrencyConverter() {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');

  const rates = { USD: 1.09, GBP: 0.86, CHF: 0.95, PLN: 4.35 };
  const converted = amount ? (parseFloat(amount) * (rates[currency] || 1)).toFixed(2) : '0.00';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <DollarSign className="w-4 h-4" />
          Währungsrechner
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Input
          type="number"
          placeholder="Betrag in EUR"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        
        <Select value={currency} onValueChange={setCurrency}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="USD">USD</SelectItem>
            <SelectItem value="GBP">GBP</SelectItem>
            <SelectItem value="CHF">CHF</SelectItem>
            <SelectItem value="PLN">PLN</SelectItem>
          </SelectContent>
        </Select>

        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-900">Umgerechnet:</p>
          <p className="text-2xl font-bold text-blue-900">{converted} {currency}</p>
        </div>
      </CardContent>
    </Card>
  );
}