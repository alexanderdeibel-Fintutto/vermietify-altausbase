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
import { TrendingDown, AlertCircle } from 'lucide-react';

export default function TaxLossHarvestingAdvisor() {
  const [country, setCountry] = useState('DE');
  const [totalIncome, setTotalIncome] = useState(100000);
  const [capitalGains, setCapitalGains] = useState(30000);
  const [harvesting, setHarvesting] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['taxLossHarvesting', country, totalIncome, capitalGains],
    queryFn: async () => {
      const response = await base44.functions.invoke('suggestTaxLossHarvesting', {
        country,
        total_income: totalIncome,
        capital_gains: capitalGains
      });
      return response.data?.advice || {};
    },
    enabled: harvesting
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">🎯 Steuerverlusternten-Berater</h1>
        <p className="text-slate-500 mt-1">Nutzen Sie Verluste zur Steueroptimierung</p>
      </div>

      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Finanzielle Eingaben</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={harvesting}>
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
              <label className="text-sm font-medium">Gesamteinkommen (€)</label>
              <Input
                type="number"
                value={totalIncome}
                onChange={(e) => setTotalIncome(parseInt(e.target.value) || 0)}
                disabled={harvesting}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Kapitalgewinne (€)</label>
              <Input
                type="number"
                value={capitalGains}
                onChange={(e) => setCapitalGains(parseInt(e.target.value) || 0)}
                disabled={harvesting}
              />
            </div>
          </div>

          <Button
            onClick={() => setHarvesting(true)}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            disabled={harvesting}
          >
            {harvesting ? '⏳ Wird analysiert...' : 'Analysieren'}
          </Button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Wird analysiert...</div>
      ) : harvesting && result.content ? (
        <>
          {result.content?.potential_savings && (
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-sm text-slate-600">Potenzielle Steuereinsparungen</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  €{Math.round(result.content.potential_savings).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          )}

          {(result.content?.strategies || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <TrendingDown className="w-4 h-4" />
                  💡 Strategien
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.strategies.map((strategy, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded">
                    • {strategy}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {(result.content?.considerations || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  ⚠️ Überlegungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.considerations.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">Geben Sie Ihre Finanzdaten ein</div>
      )}
    </div>
  );
}