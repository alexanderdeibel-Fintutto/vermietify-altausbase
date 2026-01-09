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
import { Building2, TrendingDown, CheckCircle2 } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function EntityTaxPlanning() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [businessType, setBusinessType] = useState('freelancer');
  const [businessIncome, setBusinessIncome] = useState(80000);
  const [businessExpenses, setBusinessExpenses] = useState(20000);
  const [planning, setPlanning] = useState(false);

  const { data: result = {}, isLoading } = useQuery({
    queryKey: ['entityTaxPlanning', country, taxYear, businessType, businessIncome, businessExpenses],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateEntityTaxPlanning', {
        country,
        taxYear,
        businessType,
        businessIncome,
        businessExpenses
      });
      return response.data?.planning || {};
    },
    enabled: planning
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🏢 Unternehmens-Steuerplanung</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie die Besteuerung Ihrer Geschäftstätigkeit</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Geschäftsprofil</CardTitle>
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
              <label className="text-sm font-medium">Geschäftstyp</label>
              <Select value={businessType} onValueChange={setBusinessType} disabled={planning}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="freelancer">Freiberufler</SelectItem>
                  <SelectItem value="sole_proprietor">Einzelunternehmer</SelectItem>
                  <SelectItem value="partnership">Partnerschaft</SelectItem>
                  <SelectItem value="gmbh">GmbH</SelectItem>
                  <SelectItem value="corporation">Kapitalgesellschaft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Geschäftseinkommen (€)</label>
              <Input
                type="number"
                value={businessIncome}
                onChange={(e) => setBusinessIncome(parseInt(e.target.value))}
                disabled={planning}
              />
            </div>
            <div>
              <label className="text-sm font-medium">Geschäftsausgaben (€)</label>
              <Input
                type="number"
                value={businessExpenses}
                onChange={(e) => setBusinessExpenses(parseInt(e.target.value))}
                disabled={planning}
              />
            </div>
          </div>

          <button
            onClick={() => setPlanning(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={planning}
          >
            {planning ? '⏳ Wird geplant...' : 'Steuerplanung erstellen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Planung läuft...</div>
      ) : planning && result.content ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Steuerlast</p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  €{Math.round(result.content?.estimated_tax_liability || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Geschätzte Einsparungen</p>
                <p className="text-2xl font-bold text-green-600 mt-2">
                  €{Math.round(result.content?.annual_savings_estimate || 0).toLocaleString()}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-xs text-slate-600">Optimale Struktur</p>
                <p className="text-sm font-bold text-purple-600 mt-2">{result.content?.optimal_structure}</p>
              </CardContent>
            </Card>
          </div>

          {/* Current Structure Analysis */}
          {result.content?.current_structure_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  📊 Aktuelle Struktur-Analyse
                </CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(result.content.current_structure_analysis).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{typeof value === 'number' ? `€${Math.round(value).toLocaleString()}` : value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Alternative Structures */}
          {(result.content?.alternative_structures || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">💡 Alternative Strukturen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {result.content.alternative_structures.map((structure, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">{structure.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{structure.benefits}</p>
                    {structure.estimated_savings && (
                      <p className="text-xs font-bold text-green-600 mt-1">
                        Einsparungen: €{Math.round(structure.estimated_savings).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Action Items */}
          {(result.content?.action_items || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ Maßnahmen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.content.action_items.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <span className="text-green-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Füllen Sie Ihr Geschäftsprofil aus und klicken Sie "Steuerplanung erstellen"
        </div>
      )}
    </div>
  );
}