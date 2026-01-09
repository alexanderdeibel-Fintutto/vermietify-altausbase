import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TrendingDown, Zap, Target } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxSavingsOpportunities() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [generating, setGenerating] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['taxSavingsReport', country, taxYear],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxSavingsReport', {
        country,
        taxYear
      });
      return response.data?.report || {};
    },
    enabled: generating
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">💰 Steuer-Sparpotenziale</h1>
        <p className="text-slate-500 mt-1">Identifizieren Sie ungenutzte Sparoptionen</p>
      </div>

      {/* Controls */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="text-sm font-medium">Land</label>
          <Select value={country} onValueChange={setCountry} disabled={generating}>
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
          <label className="text-sm font-medium">Steuerjahr</label>
          <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={generating}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[CURRENT_YEAR - 1, CURRENT_YEAR].map(year => (
                <SelectItem key={year} value={String(year)}>{year}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <button
          onClick={() => setGenerating(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
          disabled={generating}
        >
          {generating ? '⏳...' : 'Bericht generieren'}
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-8">⏳ Bericht wird erstellt...</div>
      ) : generating && result.content ? (
        <>
          {/* Savings Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {result.content?.realized_savings && (
              <Card className="border-green-300 bg-green-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-slate-600">Bereits realisierte Einsparungen</p>
                  <p className="text-3xl font-bold text-green-600 mt-2">
                    €{Math.round(result.content.realized_savings).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
            {result.content?.total_opportunity && (
              <Card className="border-blue-300 bg-blue-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-slate-600">Gesamtes Sparpotenzial</p>
                  <p className="text-3xl font-bold text-blue-600 mt-2">
                    €{Math.round(result.content.total_opportunity).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
            {result.content?.total_opportunity && result.content?.realized_savings && (
              <Card className="border-purple-300 bg-purple-50">
                <CardContent className="pt-6 text-center">
                  <p className="text-sm text-slate-600">Ungenutztes Potenzial</p>
                  <p className="text-3xl font-bold text-purple-600 mt-2">
                    €{Math.round((result.content.total_opportunity - result.content.realized_savings)).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Wins */}
          {(result.content?.quick_wins || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  ⚡ Schnelle Gewinne
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.quick_wins.map((win, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {win}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Opportunities */}
          {(result.content?.opportunities || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Target className="w-4 h-4" />
                  💡 Sparpotenziale nach Priorität
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.content.opportunities.map((opp, i) => (
                  <div key={i} className="p-3 bg-slate-50 rounded border-l-4 border-blue-400">
                    <div className="flex justify-between">
                      <p className="font-medium text-sm">{opp.name}</p>
                      <p className="font-bold text-blue-600">€{Math.round(opp.savings || 0).toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">{opp.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Long-term Strategies */}
          {(result.content?.long_term_strategies || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">📈 Langfristige Strategien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.long_term_strategies.map((strategy, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {strategy}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Priority */}
          {(result.content?.implementation_priority || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Implementierungs-Reihenfolge</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.implementation_priority.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-slate-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Klicken Sie "Bericht generieren", um Sparpotenziale zu identifizieren
        </div>
      )}
    </div>
  );
}