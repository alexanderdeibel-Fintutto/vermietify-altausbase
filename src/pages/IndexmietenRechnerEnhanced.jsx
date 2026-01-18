import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { base44 } from '@/api/base44Client';
import { TrendingUp } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function IndexmietenRechnerEnhanced() {
  const [input, setInput] = useState({
    miete_aktuell: '',
    letzte_anpassung_datum: '',
    schwellenwert: 0
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const calculate = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('calculateIndexmiete', input);
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
            <TrendingUp className="h-9 w-9" />
          </div>
          <h1 className="vf-tool-title">Indexmieten-Rechner</h1>
          <p className="vf-tool-description">
            Berechnen Sie die neue Miete nach VPI-Indexanpassung
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
                  label="Aktuelle Miete"
                  type="number"
                  rightAddon="€"
                  value={input.miete_aktuell}
                  onChange={(e) => setInput({ ...input, miete_aktuell: e.target.value })}
                />
                <VfDatePicker
                  label="Letzte Anpassung"
                  value={input.letzte_anpassung_datum}
                  onChange={(v) => setInput({ ...input, letzte_anpassung_datum: v })}
                />
                <VfInput
                  label="Schwellenwert"
                  type="number"
                  rightAddon="%"
                  hint="Optional: Mindesterhöhung für Anpassung"
                  value={input.schwellenwert}
                  onChange={(e) => setInput({ ...input, schwellenwert: e.target.value })}
                />
                <Button 
                  variant="gradient" 
                  className="w-full" 
                  onClick={calculate}
                  disabled={loading || !input.miete_aktuell || !input.letzte_anpassung_datum}
                >
                  Berechnen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="vf-calculator-result-panel">
            {!result ? (
              <div className="vf-calculator-result-empty">
                <TrendingUp className="h-16 w-16 mx-auto mb-4" />
                <p>Geben Sie Ihre Daten ein</p>
              </div>
            ) : (
              <CardContent className="p-6">
                <div className="vf-calculator-primary-result">
                  <div className="vf-calculator-primary-label">Neue Miete</div>
                  <div className="vf-calculator-primary-value">
                    <CurrencyDisplay amount={result.neue_miete} />
                  </div>
                </div>

                <div className="vf-calculator-secondary-results">
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Steigerung</div>
                    <div className="vf-calculator-secondary-value text-[var(--vf-success-600)]">
                      +{result.steigerung_prozent}%
                    </div>
                  </div>
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Differenz</div>
                    <div className="vf-calculator-secondary-value">
                      <CurrencyDisplay amount={result.differenz} />
                    </div>
                  </div>
                </div>

                <div className="vf-calculator-breakdown">
                  <div className="vf-calculator-breakdown-title">VPI-Index</div>
                  <div className="vf-calculator-breakdown-item">
                    <span>VPI alt</span>
                    <span>{result.vpi_alt}</span>
                  </div>
                  <div className="vf-calculator-breakdown-item">
                    <span>VPI neu</span>
                    <span>{result.vpi_neu}</span>
                  </div>
                </div>

                {result.anpassung_moeglich ? (
                  <div className="mt-4 p-3 bg-[var(--vf-success-50)] text-[var(--vf-success-700)] rounded-lg text-center">
                    ✓ Anpassung ist möglich
                  </div>
                ) : (
                  <div className="mt-4 p-3 bg-[var(--vf-warning-50)] text-[var(--vf-warning-700)] rounded-lg text-center">
                    ⚠ Schwellenwert noch nicht erreicht
                  </div>
                )}
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}