import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Home } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function KaufpreisRechner() {
  const [input, setInput] = useState({
    miete_kalt_monat: '',
    ziel_rendite: 5,
    nebenkosten_prozent: 10
  });

  const calculate = () => {
    const jahresmiete = (parseFloat(input.miete_kalt_monat) || 0) * 12;
    const rendite = parseFloat(input.ziel_rendite) / 100;
    const nebenkosten = parseFloat(input.nebenkosten_prozent) / 100;

    const maxKaufpreis = jahresmiete / rendite;
    const maxKaufpreisOhneNK = maxKaufpreis / (1 + nebenkosten);
    const kaufpreisfaktor = maxKaufpreisOhneNK / jahresmiete;

    return {
      maxKaufpreis: maxKaufpreisOhneNK,
      maxKaufpreisMitNK: maxKaufpreis,
      nebenkosten: maxKaufpreis - maxKaufpreisOhneNK,
      kaufpreisfaktor,
      jahresmiete
    };
  };

  const result = calculate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vf-primary-50)] to-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="vf-tool-icon mx-auto mb-4">
            <Home className="h-9 w-9" />
          </div>
          <h1 className="vf-tool-title">Kaufpreis-Rechner</h1>
          <p className="vf-tool-description">
            Ermitteln Sie den maximalen Kaufpreis für Ihre Zielrendite
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
                  label="Kaltmiete pro Monat"
                  type="number"
                  rightAddon="€"
                  value={input.miete_kalt_monat}
                  onChange={(e) => setInput({ ...input, miete_kalt_monat: e.target.value })}
                />
                <VfInput
                  label="Zielrendite"
                  type="number"
                  rightAddon="%"
                  value={input.ziel_rendite}
                  onChange={(e) => setInput({ ...input, ziel_rendite: e.target.value })}
                />
                <VfInput
                  label="Erwerbsnebenkosten"
                  type="number"
                  rightAddon="%"
                  value={input.nebenkosten_prozent}
                  onChange={(e) => setInput({ ...input, nebenkosten_prozent: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="vf-calculator-result-panel">
            {!input.miete_kalt_monat ? (
              <div className="vf-calculator-result-empty">
                <Home className="h-16 w-16 mx-auto mb-4" />
                <p>Geben Sie die Kaltmiete ein</p>
              </div>
            ) : (
              <CardContent className="p-6">
                <div className="vf-calculator-primary-result">
                  <div className="vf-calculator-primary-label">Max. Kaufpreis</div>
                  <div className="vf-calculator-primary-value">
                    <CurrencyDisplay amount={result.maxKaufpreis} />
                  </div>
                </div>

                <div className="vf-calculator-secondary-results">
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Mit NK</div>
                    <div className="vf-calculator-secondary-value">
                      <CurrencyDisplay amount={result.maxKaufpreisMitNK} />
                    </div>
                  </div>
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Kaufpreisfaktor</div>
                    <div className="vf-calculator-secondary-value">
                      {result.kaufpreisfaktor.toFixed(1)}
                    </div>
                  </div>
                </div>

                <div className="vf-calculator-breakdown">
                  <div className="vf-calculator-breakdown-title">Kostenaufstellung</div>
                  <div className="vf-calculator-breakdown-item">
                    <span>Kaufpreis (netto)</span>
                    <CurrencyDisplay amount={result.maxKaufpreis} />
                  </div>
                  <div className="vf-calculator-breakdown-item">
                    <span>Erwerbsnebenkosten</span>
                    <CurrencyDisplay amount={result.nebenkosten} />
                  </div>
                  <div className="vf-calculator-breakdown-item border-t-2 border-[var(--vf-neutral-300)] pt-2 mt-2 font-bold">
                    <span>Gesamtkosten</span>
                    <CurrencyDisplay amount={result.maxKaufpreisMitNK} />
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