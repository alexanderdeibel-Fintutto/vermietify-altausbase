import React, { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { TrendingUp } from 'lucide-react';

export default function CapitalGainCalculator({ userEmail }) {
  const [amount, setAmount] = useState('');
  const [result, setResult] = useState(null);

  const calculateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('calculateCapitalGainsTax', data),
    onSuccess: (response) => {
      setResult(response.data);
    },
  });

  const handleCalculate = (e) => {
    e.preventDefault();
    if (!amount) return;
    
    calculateMutation.mutate({
      taxable_amount: parseFloat(amount),
      user_email: userEmail,
      use_saver_allowance: true,
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Kapitalertragsteuer
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleCalculate} className="space-y-3">
          <div>
            <Label htmlFor="amount">Gewinn (EUR)</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="z.B. 5000"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={!amount || calculateMutation.isPending}
          >
            Berechnen
          </Button>
        </form>

        {result && (
          <div className="bg-slate-50 rounded-lg p-4 space-y-2 border border-slate-200">
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-slate-600">Sparerpauschbetrag genutzt</p>
                <p className="font-bold">{result.freibetragUsed.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
              <div>
                <p className="text-slate-600">Steuerpflichtiger Betrag</p>
                <p className="font-bold">{(result.taxable_amount - result.freibetragUsed).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
              </div>
            </div>
            
            <div className="border-t pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-slate-600">KESt</p>
                  <p className="font-bold">{result.kest.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                </div>
                <div>
                  <p className="text-slate-600">Solidaritätszuschlag</p>
                  <p className="font-bold">{result.soli.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                </div>
              </div>
              {result.kirchensteuer > 0 && (
                <div className="grid grid-cols-2 gap-3 text-sm mt-2">
                  <div>
                    <p className="text-slate-600">Kirchensteuer</p>
                    <p className="font-bold">{result.kirchensteuer.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="border-t pt-2 bg-blue-50 p-2 rounded border border-blue-200">
              <p className="text-sm text-blue-900">
                Zu zahlen: <span className="font-bold text-lg">{result.total.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</span>
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Netto nach Steuern: {result.netAmount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}