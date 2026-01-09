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
import { Heart, AlertTriangle, CheckCircle2, TrendingDown } from 'lucide-react';

export default function EstateTaxPlanning() {
  const [country, setCountry] = useState('DE');
  const [totalAssets, setTotalAssets] = useState(1000000);
  const [familyStatus, setFamilyStatus] = useState('married');
  const [charitableGoals, setCharitableGoals] = useState(false);
  const [planning, setPlanning] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['estateTaxPlanning', country, totalAssets, familyStatus, charitableGoals],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateEstateTaxPlanning', {
        country,
        totalAssets,
        familyStatus,
        charitableGoals
      });
      return response.data?.planning || {};
    },
    enabled: planning
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">❤️ Nachlasssteuer-Planung</h1>
        <p className="text-slate-500 mt-1">Planen Sie die Vermögensübertragung und Erbschaftsteuer</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Vermögensprofil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={planning}>
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
              <label className="text-sm font-medium">Familienstand</label>
              <Select value={familyStatus} onValueChange={setFamilyStatus} disabled={planning}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single">Alleinstehend</SelectItem>
                  <SelectItem value="married">Verheiratet</SelectItem>
                  <SelectItem value="widowed">Verwitwet</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <label className="text-sm font-medium">Gesamtvermögen (€)</label>
            <Input
              type="number"
              value={totalAssets}
              onChange={(e) => setTotalAssets(parseInt(e.target.value))}
              disabled={planning}
            />
          </div>

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={charitableGoals}
              onChange={(e) => setCharitableGoals(e.target.checked)}
              disabled={planning}
            />
            <span className="text-sm">Wohltätige Ziele</span>
          </label>

          <button
            onClick={() => setPlanning(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={planning}
          >
            {planning ? '⏳ Wird geplant...' : 'Nachlassplanung erstellen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Planung läuft...</div>
      ) : planning && result.content ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-red-300 bg-red-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Erbschaftsteuer</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round(result.content?.estimated_estate_tax || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Verfügbare Freibeträge</p>
                <p className="text-2xl font-bold text-blue-600 mt-2">
                  €{Math.round(result.content?.available_exemptions || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card className="border-green-300 bg-green-50">
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Einsparungen</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(result.content?.estimated_tax_savings || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Estate Analysis */}
          {result.content?.current_estate_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Vermögensanalyse</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(result.content.current_estate_analysis).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{typeof value === 'number' ? `€${Math.round(value).toLocaleString()}` : value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Tax Reduction Strategies */}
          {(result.content?.tax_reduction_strategies || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Steuerminderungsstrategien</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.content.tax_reduction_strategies.map((strategy, i) => (
                  <div key={i} className="border-l-4 border-green-300 pl-3 py-2 bg-white p-3 rounded">
                    <p className="font-medium text-sm">{strategy.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{strategy.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Trust Recommendations */}
          {(result.content?.trust_recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Trust-Empfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.trust_recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Füllen Sie Ihr Vermögensprofil aus und klicken Sie "Nachlassplanung erstellen"
        </div>
      )}
    </div>
  );
}