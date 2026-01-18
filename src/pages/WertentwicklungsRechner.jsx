import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { LineChart, TrendingUp } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function WertentwicklungsRechner() {
  const [input, setInput] = useState({
    startkapital: '',
    wertsteigerung_jahr: 3,
    haltedauer_jahre: 10
  });

  const calculate = () => {
    const start = parseFloat(input.startkapital) || 0;
    const rate = parseFloat(input.wertsteigerung_jahr) / 100;
    const jahre = parseInt(input.haltedauer_jahre) || 0;

    const endwert = start * Math.pow(1 + rate, jahre);
    const gewinn = endwert - start;
    const gesamtRendite = (gewinn / start) * 100;

    // Jahresweise Entwicklung für Chart
    const entwicklung = [];
    for (let i = 0; i <= jahre; i++) {
      entwicklung.push({
        jahr: i,
        wert: start * Math.pow(1 + rate, i)
      });
    }

    return {
      endwert,
      gewinn,
      gesamtRendite,
      entwicklung
    };
  };

  const result = calculate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vf-primary-50)] to-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="vf-tool-icon mx-auto mb-4">
            <LineChart className="h-9 w-9" />
          </div>
          <h1 className="vf-tool-title">Wertentwicklungs-Rechner</h1>
          <p className="vf-tool-description">
            Simulieren Sie die Wertentwicklung Ihrer Immobilie
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
                  label="Startkapital / Kaufpreis"
                  type="number"
                  rightAddon="€"
                  value={input.startkapital}
                  onChange={(e) => setInput({ ...input, startkapital: e.target.value })}
                />
                <VfInput
                  label="Wertsteigerung pro Jahr"
                  type="number"
                  rightAddon="%"
                  hint="Durchschnittlich 2-4% p.a."
                  value={input.wertsteigerung_jahr}
                  onChange={(e) => setInput({ ...input, wertsteigerung_jahr: e.target.value })}
                />
                <VfInput
                  label="Haltedauer"
                  type="number"
                  rightAddon="Jahre"
                  value={input.haltedauer_jahre}
                  onChange={(e) => setInput({ ...input, haltedauer_jahre: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="vf-calculator-result-panel">
            {!input.startkapital ? (
              <div className="vf-calculator-result-empty">
                <TrendingUp className="h-16 w-16 mx-auto mb-4" />
                <p>Geben Sie Ihre Daten ein</p>
              </div>
            ) : (
              <CardContent className="p-6">
                <div className="vf-calculator-primary-result">
                  <div className="vf-calculator-primary-label">Endwert nach {input.haltedauer_jahre} Jahren</div>
                  <div className="vf-calculator-primary-value">
                    <CurrencyDisplay amount={result.endwert} />
                  </div>
                </div>

                <div className="vf-calculator-secondary-results">
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Gewinn</div>
                    <div className="vf-calculator-secondary-value text-[var(--vf-success-600)]">
                      <CurrencyDisplay amount={result.gewinn} showSign />
                    </div>
                  </div>
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Rendite gesamt</div>
                    <div className="vf-calculator-secondary-value text-[var(--vf-success-600)]">
                      +{result.gesamtRendite.toFixed(1)}%
                    </div>
                  </div>
                </div>

                <div className="vf-calculator-breakdown">
                  <div className="vf-calculator-breakdown-title">Entwicklung (alle 2 Jahre)</div>
                  {result.entwicklung.filter((_, i) => i % 2 === 0).map((item) => (
                    <div key={item.jahr} className="vf-calculator-breakdown-item">
                      <span>Jahr {item.jahr}</span>
                      <CurrencyDisplay amount={item.wert} />
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}