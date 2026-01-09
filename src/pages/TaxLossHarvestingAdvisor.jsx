import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TrendingDown, AlertTriangle, DollarSign } from 'lucide-react';

export default function TaxLossHarvestingAdvisor() {
  const [taxYear] = useState(new Date().getFullYear());
  const [suggestions, setSuggestions] = useState(null);

  const generateSuggestions = useMutation({
    mutationFn: async () => {
      const res = await base44.functions.invoke('suggestTaxLossHarvesting', { tax_year: taxYear });
      return res.data;
    },
    onSuccess: (data) => setSuggestions(data)
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light">Tax Loss Harvesting</h1>
        <p className="text-slate-500 font-light mt-2">Nutze Verluste zur Steueroptimierung</p>
      </div>

      {!suggestions ? (
        <Card>
          <CardContent className="pt-4">
            <Button 
              onClick={() => generateSuggestions.mutate()}
              disabled={generateSuggestions.isPending}
              className="w-full"
            >
              {generateSuggestions.isPending ? 'Analysiere...' : 'Verlust-Möglichkeiten analysieren'}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Zusammenfassung */}
          <div className="grid grid-cols-2 gap-4">
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-600 font-light">Verwertbare Verluste</p>
                <p className="text-2xl font-light text-green-700 mt-1">
                  ${suggestions.recommendations?.total_harvestable_losses?.toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-4">
                <p className="text-xs text-slate-600 font-light">Geschätzte Steuereinsparung</p>
                <p className="text-2xl font-light text-blue-700 mt-1">
                  ${suggestions.recommendations?.estimated_tax_savings?.toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Wash-Sale Risiken */}
          {suggestions.recommendations?.washsale_risks?.length > 0 && (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="w-4 h-4 text-yellow-600" />
              <AlertDescription className="text-sm font-light">
                Beachte Wash-Sale Regeln: {suggestions.recommendations.washsale_risks[0]}
              </AlertDescription>
            </Alert>
          )}

          {/* Empfehlenswerte Positionen */}
          <div className="space-y-3">
            <h2 className="text-lg font-light">Harvesting-Gelegenheiten</h2>
            {suggestions.recommendations?.opportunities?.map((opp, i) => (
              <Card key={i}>
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-light text-sm">{opp.asset}</p>
                      <p className="text-xs text-slate-500 font-light">Unrealisierter Verlust</p>
                    </div>
                    <div className="text-right">
                      <p className="font-light text-sm text-red-600">-${opp.current_loss?.toLocaleString()}</p>
                      <p className="text-xs text-slate-500 font-light">{opp.harvest_date}</p>
                    </div>
                  </div>
                  
                  {opp.replacement_asset && (
                    <div className="p-2 bg-slate-50 rounded text-xs font-light">
                      💡 Ersetzen durch: {opp.replacement_asset}
                    </div>
                  )}
                  
                  {opp.risk_level === 'high' && (
                    <div className="mt-2 p-2 bg-orange-50 rounded text-xs text-orange-700 font-light">
                      ⚠️ Hohes Wash-Sale Risiko
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Implementierungs-Schritte */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Implementierung</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs font-light">
              {suggestions.recommendations?.implementation_steps?.map((step, i) => (
                <div key={i} className="flex gap-2">
                  <span className="text-slate-500">{i + 1}.</span>
                  <span>{step}</span>
                </div>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}