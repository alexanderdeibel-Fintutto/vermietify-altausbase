import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { Calculator } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function RenditeRechner() {
  const [input, setInput] = useState({
    kaufpreis: '',
    nebenkosten_prozent: 10,
    miete_kalt_monat: '',
    nicht_umlagefaehig_monat: 0
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('calculateRendite', input);
      setResult(response.data.result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vf-primary-50)] to-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="vf-tool-icon mx-auto mb-4">
            <Calculator className="h-9 w-9" />
          </div>
          <h1 className="vf-tool-title">Rendite-Rechner</h1>
          <p className="vf-tool-description">
            Berechnen Sie die Rendite Ihrer Immobilie
          </p>
        </div>

        <div className="vf-calculator">
          <Card className="vf-calculator-input-panel">
            <CardHeader>
              <CardTitle>Eingaben</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <VfInput
                  label="Kaufpreis"
                  type="number"
                  rightAddon="€"
                  value={input.kaufpreis}
                  onChange={(e) => setInput({ ...input, kaufpreis: e.target.value })}
                />
                <VfInput
                  label="Erwerbsnebenkosten"
                  type="number"
                  rightAddon="%"
                  value={input.nebenkosten_prozent}
                  onChange={(e) => setInput({ ...input, nebenkosten_prozent: e.target.value })}
                />
                <VfInput
                  label="Kaltmiete pro Monat"
                  type="number"
                  rightAddon="€"
                  value={input.miete_kalt_monat}
                  onChange={(e) => setInput({ ...input, miete_kalt_monat: e.target.value })}
                />
                <Button 
                  variant="gradient" 
                  className="w-full" 
                  onClick={calculate}
                  disabled={loading || !input.kaufpreis || !input.miete_kalt_monat}
                >
                  Berechnen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="vf-calculator-result-panel">
            {!result ? (
              <div className="vf-calculator-result-empty">
                <Calculator className="h-16 w-16 mx-auto mb-4" />
                <p>Geben Sie Ihre Daten ein und klicken Sie auf "Berechnen"</p>
              </div>
            ) : (
              <CardContent className="p-6">
                <div className="vf-calculator-primary-result">
                  <div className="vf-calculator-primary-label">Bruttorendite</div>
                  <div className="vf-calculator-primary-value">{result.brutto_rendite}%</div>
                </div>

                <div className="vf-calculator-secondary-results">
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Nettorendite</div>
                    <div className="vf-calculator-secondary-value">{result.netto_rendite}%</div>
                  </div>
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Kaufpreisfaktor</div>
                    <div className="vf-calculator-secondary-value">{result.kaufpreis_faktor}</div>
                  </div>
                </div>

                <div className="vf-calculator-breakdown">
                  <div className="vf-calculator-breakdown-title">Details</div>
                  <div className="vf-calculator-breakdown-item">
                    <span>Gesamtkosten</span>
                    <CurrencyDisplay amount={result.gesamtkosten} />
                  </div>
                  <div className="vf-calculator-breakdown-item">
                    <span>Jahresmiete (brutto)</span>
                    <CurrencyDisplay amount={result.jahresmiete_brutto} />
                  </div>
                  <div className="vf-calculator-breakdown-item">
                    <span>Jahresmiete (netto)</span>
                    <CurrencyDisplay amount={result.jahresmiete_netto} />
                  </div>
                </div>

                <div className={`mt-4 p-3 rounded-lg text-center ${
                  result.bewertung === 'gut' ? 'bg-[var(--vf-success-50)] text-[var(--vf-success-700)]' :
                  result.bewertung === 'durchschnittlich' ? 'bg-[var(--vf-warning-50)] text-[var(--vf-warning-700)]' :
                  'bg-[var(--vf-error-50)] text-[var(--vf-error-700)]'
                }`}>
                  Bewertung: {result.bewertung}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}