import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ChevronRight, ChevronLeft, AlertCircle, Zap } from 'lucide-react';

const STEPS = [
  { id: 'basic', label: 'Basis-Info', desc: 'Land, Wohnort' },
  { id: 'jurisdictions', label: 'Steuerjurisdiktionen', desc: 'Alle relevanten Länder' },
  { id: 'income', label: 'Einkommensquellen', desc: 'Diverse Einkünfte' },
  { id: 'assets', label: 'Vermögenswerte', desc: 'Aktien, Immobilien, Krypto' },
  { id: 'business', label: 'Geschäfte & Beteiligungen', desc: 'GmbH, Anteile, Firmen' },
  { id: 'review', label: 'Überblick & Analyse', desc: 'KI-gestützte Bewertung' }
];

export default function ComplexTaxSetupWizard() {
  const [step, setStep] = useState(0);
  const [formData, setFormData] = useState({
    primary_residence_country: 'CH',
    tax_jurisdictions: ['CH'],
    income_sources: [],
    asset_categories: [],
    business_entities: [],
    has_crypto_assets: false,
    number_of_properties: 0,
    number_of_companies: 0
  });
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);

  const analyzeMutation = useMutation({
    mutationFn: async (data) => {
      const response = await base44.functions.invoke('analyzeTaxComplexity', data);
      return response.data;
    },
    onSuccess: (data) => {
      setAnalysis(data);
    }
  });

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleJurisdiction = (country) => {
    setFormData(prev => ({
      ...prev,
      tax_jurisdictions: prev.tax_jurisdictions.includes(country)
        ? prev.tax_jurisdictions.filter(c => c !== country)
        : [...prev.tax_jurisdictions, country]
    }));
  };

  const toggleAssetCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      asset_categories: prev.asset_categories.includes(category)
        ? prev.asset_categories.filter(c => c !== category)
        : [...prev.asset_categories, category]
    }));
  };

  const handleAnalyze = async () => {
    setLoading(true);
    await analyzeMutation.mutateAsync(formData);
    setLoading(false);
  };

  const renderStep = () => {
    switch (STEPS[step].id) {
      case 'basic':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-light">Wohnort und Basis-Informationen</h2>
            <Select value={formData.primary_residence_country} onValueChange={(v) => updateField('primary_residence_country', v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="CH">Schweiz</SelectItem>
                <SelectItem value="DE">Deutschland</SelectItem>
                <SelectItem value="AT">Österreich</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );

      case 'jurisdictions':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-light">In welchen Ländern müssen Sie Steuern zahlen?</h2>
            <div className="space-y-2">
              {['CH', 'DE', 'AT'].map(country => (
                <label key={country} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <Checkbox
                    checked={formData.tax_jurisdictions.includes(country)}
                    onChange={() => toggleJurisdiction(country)}
                  />
                  <span className="font-light">{country === 'CH' ? 'Schweiz' : country === 'DE' ? 'Deutschland' : 'Österreich'}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'income':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-light">Einkommensquellen</h2>
            <div className="space-y-2">
              {['Arbeitgeber (Angestellter)', 'Selbstständig / Freiberufler', 'Geschäft / Unternehmung', 'Mieteinnahmen', 'Kapitalerträge / Dividenden', 'Kryptowährungen', 'Sonstige'].map(source => (
                <label key={source} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                  <Checkbox
                    checked={formData.income_sources.includes(source)}
                    onChange={() => updateField('income_sources', 
                      formData.income_sources.includes(source)
                        ? formData.income_sources.filter(s => s !== source)
                        : [...formData.income_sources, source]
                    )}
                  />
                  <span className="font-light">{source}</span>
                </label>
              ))}
            </div>
          </div>
        );

      case 'assets':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-light">Vermögensklassen</h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-light">Immobilien (Anzahl)</label>
                <Input
                  type="number"
                  value={formData.number_of_properties}
                  onChange={(e) => updateField('number_of_properties', parseInt(e.target.value) || 0)}
                  min="0"
                />
              </div>
              <div className="space-y-2">
                {['Aktien / Aktienfonds', 'Anleihen', 'Edelmetalle', 'Kryptowährungen'].map(asset => (
                  <label key={asset} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                    <Checkbox
                      checked={formData.asset_categories.includes(asset)}
                      onChange={() => toggleAssetCategory(asset)}
                    />
                    <span className="font-light">{asset}</span>
                  </label>
                ))}
              </div>
              <label className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:bg-slate-50">
                <Checkbox
                  checked={formData.has_crypto_assets}
                  onChange={() => updateField('has_crypto_assets', !formData.has_crypto_assets)}
                />
                <span className="font-light">Kryptowährungen vorhanden</span>
              </label>
            </div>
          </div>
        );

      case 'business':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-light">Unternehmensanteile & Beteiligungen</h2>
            <div>
              <label className="text-sm font-light">Anzahl der Unternehmensanteile / Beteiligungen</label>
              <Input
                type="number"
                value={formData.number_of_companies}
                onChange={(e) => updateField('number_of_companies', parseInt(e.target.value) || 0)}
                min="0"
                placeholder="z.B. GmbH-Anteile, AG-Beteiligungen"
              />
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-900">
              <p className="font-light">Je nach Anzahl und Art müssen separate Bilanzierungen pro Unternehmen durchgeführt werden.</p>
            </div>
          </div>
        );

      case 'review':
        return (
          <div className="space-y-4">
            <h2 className="text-lg font-light">Überblick & Analyse</h2>
            {analysis ? (
              <div className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm">Steuerkomplexität</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <span className="font-light">Score:</span>
                      <span className="text-2xl font-light">{analysis.complexity_score}/100</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-2">Profil-Typ: {analysis.profile_type}</p>
                  </CardContent>
                </Card>

                {analysis.risk_factors.length > 0 && (
                  <Card className="border-red-200 bg-red-50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-red-500" />
                        Risikobereich
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1 font-light">
                        {analysis.risk_factors.map((rf, i) => (
                          <li key={i}>• {rf}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.recommended_actions.length > 0 && (
                  <Card className="border-blue-200 bg-blue-50">
                    <CardHeader>
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-blue-500" />
                        Empfohlene Maßnahmen
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="text-sm space-y-1 font-light">
                        {analysis.recommended_actions.map((action, i) => (
                          <li key={i}>• {action}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {analysis.ai_recommendations && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-sm">KI-Optimierungsvorschläge</CardTitle>
                    </CardHeader>
                    <CardContent className="text-sm space-y-2 font-light">
                      {analysis.ai_recommendations.optimization_opportunities?.map((opp, i) => (
                        <p key={i}>• {opp}</p>
                      ))}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <Button onClick={handleAnalyze} className="w-full" disabled={loading}>
                {loading ? 'Analysiere...' : 'Steuerlage analysieren'}
              </Button>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-light mb-2">Komplexes Steuerszenario Setup</h1>
        <p className="text-slate-500 font-light">Schritt {step + 1} von {STEPS.length}</p>
      </div>

      {/* Schritte-Übersicht */}
      <div className="flex gap-2 mb-8 overflow-x-auto">
        {STEPS.map((s, i) => (
          <button
            key={s.id}
            onClick={() => setStep(i)}
            className={`px-4 py-2 text-sm font-light whitespace-nowrap rounded-lg transition-colors ${
              i === step
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Inhalt */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {renderStep()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(0, step - 1))}
          disabled={step === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Zurück
        </Button>
        <Button
          onClick={() => setStep(Math.min(STEPS.length - 1, step + 1))}
          disabled={step === STEPS.length - 1}
          className="gap-2"
        >
          Weiter
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}