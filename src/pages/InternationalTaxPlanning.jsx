import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Globe, CheckCircle2, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();
const COUNTRIES = ['AT', 'CH', 'DE', 'US', 'UK', 'FR'];

export default function InternationalTaxPlanning() {
  const [countries, setCountries] = useState(['DE', 'AT']);
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [residenceStatus, setResidenceStatus] = useState('resident');
  const [planning, setPlanning] = useState(false);

  const { data: strategy = {}, isLoading } = useQuery({
    queryKey: ['internationalTaxStrategy', countries, taxYear, residenceStatus],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateInternationalTaxStrategy', {
        countries,
        taxYear,
        residenceStatus
      });
      return response.data?.strategy || {};
    },
    enabled: planning
  });

  const toggleCountry = (country) => {
    setCountries(prev =>
      prev.includes(country)
        ? prev.filter(c => c !== country)
        : [...prev, country]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">🌍 Internationale Steuerplanung</h1>
        <p className="text-slate-500 mt-1">Optimieren Sie Ihre internationalen Steuerverpflichtungen</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Internationales Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Länder</label>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {COUNTRIES.map(country => (
                <Button
                  key={country}
                  onClick={() => toggleCountry(country)}
                  className={countries.includes(country) ? 'bg-blue-600 text-white' : 'bg-gray-200'}
                  variant="outline"
                >
                  {country}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Steuerjahr</label>
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={planning}>
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
            <div>
              <label className="text-sm font-medium">Wohnstatus</label>
              <Select value={residenceStatus} onValueChange={setResidenceStatus} disabled={planning}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="resident">Resident</SelectItem>
                  <SelectItem value="non-resident">Nicht-Resident</SelectItem>
                  <SelectItem value="expat">Expat</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <button
            onClick={() => setPlanning(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={planning}
          >
            {planning ? '⏳ Wird geplant...' : 'Planung durchführen'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Planung läuft...</div>
      ) : planning && strategy.content ? (
        <>
          {/* Treaty Benefits */}
          {(strategy.content?.treaty_benefits || []).length > 0 && (
            <Card className="border-green-300 bg-green-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  ✓ Steuerabkommen-Vorteile
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {strategy.content.treaty_benefits.map((benefit, i) => (
                  <div key={i} className="border-l-4 border-green-300 pl-3 py-2 bg-white p-3 rounded">
                    <p className="font-medium text-sm">{benefit.treaty || benefit.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{benefit.benefit}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Structure Recommendations */}
          {(strategy.content?.structure_recommendations || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">🏗️ Strukturempfehlungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.content.structure_recommendations.map((rec, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {rec}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Compliance Obligations */}
          {(strategy.content?.compliance_obligations || []).length > 0 && (
            <Card className="border-orange-300 bg-orange-50">
              <CardHeader>
                <CardTitle className="text-sm flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  ⚠️ Compliance-Anforderungen
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.content.compliance_obligations.map((obligation, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded">
                    • {obligation}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Foreign Income Analysis */}
          {strategy.content?.foreign_income_analysis && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📊 Ausländische Einkommensanalyse</CardTitle>
              </CardHeader>
              <CardContent>
                {Object.entries(strategy.content.foreign_income_analysis).map(([key, value]) => (
                  <div key={key} className="flex justify-between py-2 border-b last:border-b-0">
                    <span className="capitalize">{key.replace(/_/g, ' ')}</span>
                    <span className="font-bold">{value}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Implementation Steps */}
          {(strategy.content?.implementation_steps || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Implementierungsschritte</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {strategy.content.implementation_steps.map((step, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Wählen Sie Länder aus und klicken Sie "Planung durchführen"
        </div>
      )}
    </div>
  );
}