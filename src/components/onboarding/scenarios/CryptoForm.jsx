import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, X } from 'lucide-react';

export default function CryptoForm({ onSubmit, isLoading }) {
  const [holdings, setHoldings] = useState([
    { asset: '', quantity: '', exchange: '', country: '' }
  ]);

  const addHolding = () => {
    setHoldings([...holdings, { asset: '', quantity: '', exchange: '', country: '' }]);
  };

  const removeHolding = (idx) => {
    setHoldings(holdings.filter((_, i) => i !== idx));
  };

  const updateHolding = (idx, field, value) => {
    const updated = [...holdings];
    updated[idx][field] = value;
    setHoldings(updated);
  };

  const handleSubmit = () => {
    const valid = holdings.filter(h => h.asset && h.quantity);
    if (valid.length > 0) {
      onSubmit({ crypto_holdings: valid });
    }
  };

  return (
    <div className="space-y-4">
      {holdings.map((holding, idx) => (
        <div key={idx} className="grid grid-cols-4 gap-2 p-3 bg-slate-50 rounded-lg">
          <Input
            placeholder="Asset (BTC, ETH)"
            value={holding.asset}
            onChange={(e) => updateHolding(idx, 'asset', e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Quantity"
            type="number"
            value={holding.quantity}
            onChange={(e) => updateHolding(idx, 'quantity', e.target.value)}
            className="text-xs"
          />
          <Input
            placeholder="Exchange"
            value={holding.exchange}
            onChange={(e) => updateHolding(idx, 'exchange', e.target.value)}
            className="text-xs"
          />
          <div className="flex gap-1">
            {holdings.length > 1 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeHolding(idx)}
              >
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      ))}

      <Button
        variant="outline"
        size="sm"
        onClick={addHolding}
        className="w-full text-xs"
      >
        <Plus className="w-3 h-3 mr-1" />
        Weitere Holding
      </Button>

      <Button
        onClick={handleSubmit}
        disabled={isLoading}
        className="w-full"
      >
        {isLoading ? 'Speichern...' : 'Fortfahren'}
      </Button>
    </div>
  );
}