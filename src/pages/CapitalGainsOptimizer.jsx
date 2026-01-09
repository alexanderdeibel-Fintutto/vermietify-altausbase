import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, Target } from 'lucide-react';

export default function CapitalGainsOptimizer() {
  const [country, setCountry] = useState('DE');
  const [gainAmount, setGainAmount] = useState(50000);
  const [holdingPeriod, setHoldingPeriod] = useState('long');
  const [optimizing, setOptimizing] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['capitalGainsOptimization', country, gainAmount, holdingPeriod],
    queryFn: async () => {
      const response = await base44.functions.invoke('optimizeCapitalGains', {
        country,
        gain_amount: gainAmount,
        holding_period: holdingPeriod
      });
      return response.data?.optimization || {};
    },
    enabled: optimizing
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">📈 Kapitalgewinne Optimierer</h1>
        <p className="text-slate-500 mt-1">Minimieren Sie Steuern auf Investitionsgewinne</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Eingaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={optimizing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
                  <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Haltedauer</label>
              <Select value={holdingPeriod} onValueChange={setHoldingPeriod} disabled={optimizing}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="short">Kurzfristig (&lt;1 Jahr)</SelectItem>
                  <SelectItem value="medium">Mittelfristig (1-3 Jahre)</SelectItem>
                  <SelectItem value="long">Langfristig (&gt;3 Jahre)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium">Gewinn (€)</label>
              <Input
                type="number"
                value={gainAmount}
                onChange={(e) => setGainAmount(parseInt(e.target.value) || 0)}
                disabled={optimizing}
              />
            </div>
          </div>

          <Button
            onClick={() => setOptimizing(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={optimizing}
          >
            {optimizing ? '⏳ Wird optimiert...' : 'Optimieren'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird optimiert...</div>
      ) : optimizing && result.content ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Kapitalgewinn</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">€{Math.round(gainAmount).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Steuer</p>
                <p className="text-2xl font-bold text-red-600 mt-2">€{Math.round(result.content?.tax_on_gain || 0).toLocaleString()}</p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Nach Steuern</p>
                <p className="text-2xl font-bold text-green-600 mt-2">€{Math.round((gainAmount - (result.content?.tax_on_gain || 0))).toLocaleString()}</p>
              </CardContent>
            </Card>
          </div>

          {(result.content?.strategies || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Optimierungsstrategien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.strategies.map((strategy, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {strategy}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(result.content?.considerations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">⚠️ Überlegungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.considerations.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    • {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">Geben Sie Details ein und klicken Sie "Optimieren"</div>
      )}
    </div>
  );
}