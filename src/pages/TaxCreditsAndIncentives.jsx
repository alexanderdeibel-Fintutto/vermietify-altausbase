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
import { Zap, CheckCircle2, DollarSign } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

export default function TaxCreditsAndIncentives() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR);
  const [income, setIncome] = useState(75000);
  const [analyzing, setAnalyzing] = useState(false);

  const { data: analysis = {}, isLoading } = useQuery({
    queryKey: ['taxCreditsAndIncentives', country, taxYear, income],
    queryFn: async () => {
      const response = await base44.functions.invoke('generateTaxCreditsAndIncentives', {
        country,
        taxYear,
        income
      });
      return response.data?.analysis || {};
    },
    enabled: analyzing
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">⚡ Steuergutschriften & Anreize</h1>
        <p className="text-slate-500 mt-1">Finden Sie alle verfügbaren Steuergutschriften für Sie</p>
      </div>

      {/* Controls */}
      <Card className="border-blue-300 bg-blue-50">
        <CardHeader>
          <CardTitle className="text-sm">Profil</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={setCountry} disabled={analyzing}>
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
              <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))} disabled={analyzing}>
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
          </div>

          <div>
            <label className="text-sm font-medium">Jahreseinkommen (€)</label>
            <Input
              type="number"
              value={income}
              onChange={(e) => setIncome(parseInt(e.target.value))}
              disabled={analyzing}
            />
          </div>

          <button
            onClick={() => setAnalyzing(true)}
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded font-medium disabled:opacity-50"
            disabled={analyzing}
          >
            {analyzing ? '⏳ Wird analysiert...' : 'Verfügbare Gutschriften finden'}
          </button>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="text-center py-8">⏳ Analyse läuft...</div>
      ) : analyzing && analysis.content ? (
        <>
          {/* Total Credits */}
          <Card className="border-green-300 bg-green-50">
            <CardHeader>
              <CardTitle className="text-sm flex items-center gap-2">
                <Zap className="w-4 h-4" />
                💰 Geschätzte Gesamtgutschriften
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">
                €{Math.round(analysis.content?.estimated_total_credits || 0).toLocaleString()}
              </p>
            </CardContent>
          </Card>

          {/* Available Credits */}
          {(analysis.content?.available_credits || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📋 Verfügbare Gutschriften</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {analysis.content.available_credits.map((credit, i) => (
                  <div key={i} className="border-l-4 border-blue-300 pl-3 py-2 bg-blue-50 p-3 rounded">
                    <p className="font-medium text-sm">{credit.name}</p>
                    <p className="text-xs text-slate-600 mt-1">{credit.description}</p>
                    {credit.max_value && (
                      <p className="text-xs font-bold text-blue-600 mt-1">
                        Maximal: €{Math.round(credit.max_value).toLocaleString()}
                      </p>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Eligibility Checklist */}
          {(analysis.content?.eligibility_checklist || []).length > 0 && (
            <Card className="border-purple-300 bg-purple-50">
              <CardHeader>
                <CardTitle className="text-sm">✓ Anspruchsvoraussetzungen</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.content.eligibility_checklist.map((item, i) => (
                  <div key={i} className="text-sm p-2 bg-white rounded flex gap-2">
                    <CheckCircle2 className="w-4 h-4 text-purple-600 flex-shrink-0" />
                    {item}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Application Timeline */}
          {(analysis.content?.application_timeline || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📅 Antragsplan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.content.application_timeline.map((step, i) => (
                  <div key={i} className="text-sm p-2 bg-slate-50 rounded flex gap-2">
                    <span className="text-blue-600 font-bold flex-shrink-0">{i + 1}.</span>
                    {step}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Documentation Required */}
          {(analysis.content?.documentation_required || []).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">📄 Erforderliche Dokumente</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {analysis.content.documentation_required.map((doc, i) => (
                  <div key={i} className="text-sm p-2 bg-orange-50 rounded">
                    • {doc}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </>
      ) : (
        <div className="text-center py-8 text-slate-500">
          Füllen Sie Ihr Profil aus und klicken Sie "Verfügbare Gutschriften finden"
        </div>
      )}
    </div>
  );
}