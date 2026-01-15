import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, TrendingUp } from 'lucide-react';
import { toast } from 'sonner';

const BUNDESLAENDER = [
  'Bayern', 'Berlin', 'Brandenburg', 'Bremen', 'Hamburg', 'Hessen',
  'Mecklenburg-Vorpommern', 'Niedersachsen', 'NRW', 'Rheinland-Pfalz',
  'Saarland', 'Sachsen', 'Sachsen-Anhalt', 'Schleswig-Holstein', 'Thüringen'
];

export default function RenditeAnalyse() {
  const [formData, setFormData] = useState({
    kaufpreis: '',
    wohnflaeche: '',
    baujahr: new Date().getFullYear(),
    bundesland: 'NRW',
    kaltmiete: '',
    hausgeld: '',
    eigenkapital: '',
    zinssatz: '4.0',
    tilgung: '2.0'
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const analysiere = async () => {
    if (!formData.kaufpreis || !formData.kaltmiete || !formData.eigenkapital) {
      toast.error('Bitte alle erforderlichen Felder ausfüllen');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('analysiereRenditeAusDaten', {
        kaufpreis: parseFloat(formData.kaufpreis),
        wohnflaeche: formData.wohnflaeche ? parseInt(formData.wohnflaeche) : null,
        baujahr: parseInt(formData.baujahr),
        bundesland: formData.bundesland,
        kaltmiete: parseFloat(formData.kaltmiete),
        hausgeld: formData.hausgeld ? parseFloat(formData.hausgeld) : 0,
        eigenkapital: parseFloat(formData.eigenkapital),
        zinssatz: parseFloat(formData.zinssatz),
        tilgung: parseFloat(formData.tilgung)
      });

      if (response.data) {
        setResult(response.data);
        toast.success('Rendite analysiert!');
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const getEmpfehlungsfarbe = (emp) => {
    switch (emp) {
      case 'kaufen': return 'bg-green-50 border-green-200';
      case 'verhandeln': return 'bg-yellow-50 border-yellow-200';
      case 'ablehnen': return 'bg-red-50 border-red-200';
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            📊 Immobilien-Rendite-Analyse
            <span className="text-sm font-normal text-gray-500">Kaufentscheidung bewerten</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium">Kaufpreis (€) *</label>
              <Input
                name="kaufpreis"
                type="number"
                value={formData.kaufpreis}
                onChange={handleChange}
                placeholder="500000"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Wohnfläche (qm)</label>
              <Input
                name="wohnflaeche"
                type="number"
                value={formData.wohnflaeche}
                onChange={handleChange}
                placeholder="120"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Baujahr</label>
              <Input
                name="baujahr"
                type="number"
                value={formData.baujahr}
                onChange={handleChange}
                placeholder="2000"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Bundesland</label>
              <select
                name="bundesland"
                value={formData.bundesland}
                onChange={handleChange}
                className="w-full mt-1 px-3 py-2 border rounded-lg text-sm"
              >
                {BUNDESLAENDER.map(bl => (
                  <option key={bl} value={bl}>{bl}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium">Kaltmiete/Monat (€) *</label>
              <Input
                name="kaltmiete"
                type="number"
                step="0.01"
                value={formData.kaltmiete}
                onChange={handleChange}
                placeholder="1200"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Hausgeld/Monat (€)</label>
              <Input
                name="hausgeld"
                type="number"
                step="0.01"
                value={formData.hausgeld}
                onChange={handleChange}
                placeholder="250"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Eigenkapital (€) *</label>
              <Input
                name="eigenkapital"
                type="number"
                value={formData.eigenkapital}
                onChange={handleChange}
                placeholder="150000"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Zinssatz (%)</label>
              <Input
                name="zinssatz"
                type="number"
                step="0.1"
                value={formData.zinssatz}
                onChange={handleChange}
                placeholder="4.0"
                className="mt-1"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Tilgung (%)</label>
              <Input
                name="tilgung"
                type="number"
                step="0.1"
                value={formData.tilgung}
                onChange={handleChange}
                placeholder="2.0"
                className="mt-1"
              />
            </div>
          </div>

          <Button
            onClick={analysiere}
            disabled={loading}
            className="w-full gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Analysiert...
              </>
            ) : (
              <>
                <TrendingUp className="w-4 h-4" />
                Rendite analysieren
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Analyse-Ergebnis</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="text-xs text-blue-600 font-medium">Bruttomietrendite</div>
                <div className="text-2xl font-bold text-blue-900 mt-1">
                  {result.renditen?.bruttomietrendite?.toFixed(2)}%
                </div>
              </div>
              <div className="bg-green-50 p-4 rounded-lg">
                <div className="text-xs text-green-600 font-medium">Nettomietrendite</div>
                <div className="text-2xl font-bold text-green-900 mt-1">
                  {result.renditen?.nettomietrendite?.toFixed(2)}%
                </div>
              </div>
              <div className="bg-purple-50 p-4 rounded-lg">
                <div className="text-xs text-purple-600 font-medium">Eigenkapitalrendite</div>
                <div className="text-2xl font-bold text-purple-900 mt-1">
                  {result.renditen?.eigenkapitalrendite?.toFixed(2)}%
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 font-medium">Monatlicher Cashflow</div>
                <div className={`text-xl font-bold mt-1 ${result.renditen?.cashflow_monatlich >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.renditen?.cashflow_monatlich?.toFixed(2)}€
                </div>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="text-sm text-gray-600 font-medium">Jährlicher Cashflow</div>
                <div className={`text-xl font-bold mt-1 ${result.renditen?.cashflow_jaehrlich >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {result.renditen?.cashflow_jaehrlich?.toFixed(2)}€
                </div>
              </div>
            </div>

            {result.bewertung && (
              <div className={`border rounded-lg p-4 ${getEmpfehlungsfarbe(result.bewertung.empfehlung)}`}>
                <h3 className="font-semibold mb-2">
                  {result.bewertung.empfehlung === 'kaufen' && '✅ KAUFEMPFEHLUNG'}
                  {result.bewertung.empfehlung === 'verhandeln' && '🤝 VERHANDELN'}
                  {result.bewertung.empfehlung === 'ablehnen' && '❌ ABLEHNUNG'}
                </h3>
                <p className="text-sm mb-2">{result.bewertung.begruendung}</p>
                <div className="text-sm font-semibold">
                  Note: {result.bewertung.gesamtnote}
                </div>
              </div>
            )}

            {result._meta && (
              <div className="text-xs text-gray-500 pt-2 border-t">
                ℹ️ Kosten: {result._meta.costEur}€
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}