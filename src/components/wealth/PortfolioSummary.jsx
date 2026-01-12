import React from 'react';
import { Card } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';

export default function PortfolioSummary({ userEmail, stocks, cryptos, metals }) {
  const calculateTotal = () => {
    let total = 0;
    
    stocks.forEach(s => {
      total += (s.current_price || 0) * (s.quantity || 0);
    });
    
    cryptos.forEach(c => {
      const valuation = c.current_price_eur || 0;
      total += valuation;
    });
    
    metals.forEach(m => {
      const value = (m.current_price_per_gram || 0) * (m.weight_grams || 0);
      total += value;
    });
    
    return total;
  };

  const total = calculateTotal();
  const change = Math.random() * 1000 - 500; // Placeholder

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Gesamtwert</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">
              {total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </p>
          </div>
          <DollarSign className="w-10 h-10 text-blue-600 opacity-20" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Aktien & ETFs</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{stocks.length}</p>
          </div>
          <TrendingUp className="w-10 h-10 text-green-600 opacity-20" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Kryptowährungen</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{cryptos.length}</p>
          </div>
          <TrendingUp className="w-10 h-10 text-orange-600 opacity-20" />
        </div>
      </Card>

      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-slate-600">Edelmetalle & Sonstige</p>
            <p className="text-2xl font-bold text-slate-900 mt-2">{metals.length}</p>
          </div>
          <TrendingUp className="w-10 h-10 text-yellow-600 opacity-20" />
        </div>
      </Card>
    </div>
  );
}