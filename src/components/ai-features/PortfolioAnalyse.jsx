import React, { useState } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PortfolioAnalyse() {
  const [portfolioText, setPortfolioText] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const analysiere = async () => {
    if (!portfolioText.trim()) {
      toast.error('Bitte Portfolio-Daten eingeben');
      return;
    }

    setLoading(true);
    try {
      const response = await base44.functions.invoke('analysierePortfolio', {
        portfolio_daten: portfolioText
      });

      if (response.data) {
        setResult(response.data);
        toast.success('Portfolio analysiert!');
      }
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>🏢 Portfolio-Analyse</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <textarea
            value={portfolioText}
            onChange={(e) => setPortfolioText(e.target.value)}
            placeholder="Gib deine Portfolio-Daten ein:&#10;- Objekt 1: Ort, Kaufpreis, Miete&#10;- Objekt 2: ...&#10;etc."
            className="w-full p-3 border rounded-lg text-sm font-mono"
            rows="6"
          />
          <Button
            onClick={analysiere}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Analysiert...
              </>
            ) : (
              '🔍 Portfolio analysieren'
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
            {result.portfolio_uebersicht && (
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-xs text-blue-600 font-medium">Objekte</div>
                  <div className="text-2xl font-bold text-blue-900">{result.portfolio_uebersicht.anzahl_objekte}</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-xs text-green-600 font-medium">Ø Rendite</div>
                  <div className="text-2xl font-bold text-green-900">{result.portfolio_uebersicht.durchschnittliche_rendite?.toFixed(2)}%</div>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg">
                  <div className="text-xs text-purple-600 font-medium">Eigenkapitalquote</div>
                  <div className="text-2xl font-bold text-purple-900">{result.portfolio_uebersicht.eigenkapitalquote?.toFixed(1)}%</div>
                </div>
                <div className="bg-orange-50 p-4 rounded-lg">
                  <div className="text-xs text-orange-600 font-medium">Jährliche Miete</div>
                  <div className="text-2xl font-bold text-orange-900">{(result.portfolio_uebersicht.gesamte_mieteinnahmen_jaehrlich / 1000).toFixed(0)}k€</div>
                </div>
              </div>
            )}

            {result.diversifikation && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-900 mb-3">📍 Diversifikation</h3>
                <div className="text-sm text-gray-700 mb-3">{result.diversifikation.kommentar}</div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Bewertung:</span>
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${
                    result.diversifikation.bewertung === 'gut' ? 'bg-green-100 text-green-800' :
                    result.diversifikation.bewertung === 'mittel' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.diversifikation.bewertung.toUpperCase()}
                  </span>
                </div>
              </div>
            )}

            {result.risiko_analyse && (
              <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg">
                <h3 className="font-semibold text-orange-900 mb-3">⚠️ Risikoanalyse</h3>
                <div className="space-y-2 text-sm text-orange-800">
                  <div><strong>Gesamtrisiko:</strong> {result.risiko_analyse.gesamtrisiko}</div>
                  {result.risiko_analyse.klumpenrisiken?.length > 0 && (
                    <div>
                      <strong>Klumpenrisiken:</strong>
                      <ul className="ml-4 mt-1">
                        {result.risiko_analyse.klumpenrisiken.map((risiko, idx) => (
                          <li key={idx}>• {risiko}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {result.optimierungspotenzial?.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">💡 Optimierungspotenzial</h3>
                <div className="space-y-2">
                  {result.optimierungspotenzial.map((opt, idx) => (
                    <div key={idx} className="p-3 bg-blue-50 rounded border border-blue-200">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-gray-900">{opt.bereich}</span>
                        <span className={`text-xs px-2 py-1 rounded ${
                          opt.prioritaet === 'hoch' ? 'bg-red-100 text-red-800' :
                          opt.prioritaet === 'mittel' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                          {opt.prioritaet}
                        </span>
                      </div>
                      <div className="text-sm text-gray-700">{opt.empfehlung}</div>
                    </div>
                  ))}
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