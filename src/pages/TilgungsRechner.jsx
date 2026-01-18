import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrendingDown } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function TilgungsRechner() {
  const [input, setInput] = useState({
    darlehenssumme: '',
    zinssatz: '',
    tilgungssatz: 2,
    sondertilgung_jahr: 0
  });

  const calculate = () => {
    const darlehen = parseFloat(input.darlehenssumme) || 0;
    const zins = parseFloat(input.zinssatz) / 100;
    const tilgung = parseFloat(input.tilgungssatz) / 100;
    const sondertilgung = parseFloat(input.sondertilgung_jahr) || 0;

    const annuitaet = darlehen * (zins + tilgung);
    const monatsrate = annuitaet / 12;
    const zinsanteilJahr1 = darlehen * zins;
    const tilgungsanteilJahr1 = annuitaet - zinsanteilJahr1 + sondertilgung;

    // Einfache Schätzung der Laufzeit
    let restschuld = darlehen;
    let jahre = 0;
    while (restschuld > 0 && jahre < 50) {
      const zinsJahr = restschuld * zins;
      const tilgungJahr = annuitaet - zinsJahr + sondertilgung;
      restschuld -= tilgungJahr;
      jahre++;
    }

    return {
      monatsrate,
      annuitaet,
      zinsanteilJahr1,
      tilgungsanteilJahr1,
      laufzeitJahre: jahre,
      gesamtkosten: annuitaet * jahre + (sondertilgung * jahre),
      gesamtzins: (annuitaet * jahre + (sondertilgung * jahre)) - darlehen
    };
  };

  const result = calculate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vf-primary-50)] to-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="vf-tool-icon mx-auto mb-4">
            <TrendingDown className="h-9 w-9" />
          </div>
          <h1 className="vf-tool-title">Tilgungs-Rechner</h1>
          <p className="vf-tool-description">
            Berechnen Sie Ihre Darlehensrate und Laufzeit
          </p>
        </div>

        <div className="vf-calculator">
          <Card className="vf-calculator-input-panel">
            <CardHeader>
              <CardTitle>Darlehensdaten</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <VfInput
                  label="Darlehenssumme"
                  type="number"
                  rightAddon="€"
                  value={input.darlehenssumme}
                  onChange={(e) => setInput({ ...input, darlehenssumme: e.target.value })}
                />
                <VfInput
                  label="Zinssatz"
                  type="number"
                  rightAddon="%"
                  value={input.zinssatz}
                  onChange={(e) => setInput({ ...input, zinssatz: e.target.value })}
                />
                <VfInput
                  label="Tilgungssatz"
                  type="number"
                  rightAddon="%"
                  value={input.tilgungssatz}
                  onChange={(e) => setInput({ ...input, tilgungssatz: e.target.value })}
                />
                <VfInput
                  label="Sondertilgung (jährlich)"
                  type="number"
                  rightAddon="€"
                  value={input.sondertilgung_jahr}
                  onChange={(e) => setInput({ ...input, sondertilgung_jahr: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="vf-calculator-result-panel">
            {!input.darlehenssumme || !input.zinssatz ? (
              <div className="vf-calculator-result-empty">
                <TrendingDown className="h-16 w-16 mx-auto mb-4" />
                <p>Geben Sie Darlehensdaten ein</p>
              </div>
            ) : (
              <CardContent className="p-6">
                <div className="vf-calculator-primary-result">
                  <div className="vf-calculator-primary-label">Monatliche Rate</div>
                  <div className="vf-calculator-primary-value">
                    <CurrencyDisplay amount={result.monatsrate} />
                  </div>
                </div>

                <div className="vf-calculator-secondary-results">
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Laufzeit</div>
                    <div className="vf-calculator-secondary-value">{result.laufzeitJahre} Jahre</div>
                  </div>
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Gesamtzins</div>
                    <div className="vf-calculator-secondary-value">
                      <CurrencyDisplay amount={result.gesamtzins} />
                    </div>
                  </div>
                </div>

                <div className="vf-calculator-breakdown">
                  <div className="vf-calculator-breakdown-title">1. Jahr</div>
                  <div className="vf-calculator-breakdown-item">
                    <span>Zinsanteil</span>
                    <CurrencyDisplay amount={result.zinsanteilJahr1} />
                  </div>
                  <div className="vf-calculator-breakdown-item">
                    <span>Tilgungsanteil</span>
                    <CurrencyDisplay amount={result.tilgungsanteilJahr1} />
                  </div>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}