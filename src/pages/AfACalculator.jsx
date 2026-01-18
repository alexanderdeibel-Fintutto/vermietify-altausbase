import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { VfSelect } from '@/components/shared/VfSelect';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Percent } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function AfACalculator() {
  const [input, setInput] = useState({
    anschaffungskosten: '',
    baujahr: '',
    gebaeudeart: 'wohngebaeude',
    denkmalschutz: false
  });
  const [result, setResult] = useState(null);

  const calculate = () => {
    const kosten = parseFloat(input.anschaffungskosten);
    const alter = new Date().getFullYear() - parseInt(input.baujahr);
    
    let afaSatz = 2.0; // Standard für Wohngebäude nach 1924
    if (alter > 100) afaSatz = 2.5;
    if (input.denkmalschutz) afaSatz = 9.0; // Erhöhte AfA bei Denkmalschutz
    if (input.gebaeudeart === 'gewerbe') afaSatz = 3.0;

    const jahresAfA = kosten * (afaSatz / 100);

    setResult({
      afaSatz,
      jahresAfA,
      monatsAfA: jahresAfA / 12,
      laufzeit: Math.ceil(100 / afaSatz)
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vf-primary-50)] to-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="vf-tool-icon mx-auto mb-4">
            <Percent className="h-9 w-9" />
          </div>
          <h1 className="vf-tool-title">AfA-Rechner</h1>
          <p className="vf-tool-description">
            Berechnen Sie die Abschreibung für Ihre Immobilie nach § 7 EStG
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
                  label="Anschaffungskosten (Gebäudeanteil)"
                  type="number"
                  rightAddon="€"
                  hint="Nur Gebäude, ohne Grundstück"
                  value={input.anschaffungskosten}
                  onChange={(e) => setInput({ ...input, anschaffungskosten: e.target.value })}
                />
                <VfInput
                  label="Baujahr"
                  type="number"
                  value={input.baujahr}
                  onChange={(e) => setInput({ ...input, baujahr: e.target.value })}
                />
                <VfSelect
                  label="Gebäudeart"
                  value={input.gebaeudeart}
                  onChange={(v) => setInput({ ...input, gebaeudeart: v })}
                  options={[
                    { value: 'wohngebaeude', label: 'Wohngebäude' },
                    { value: 'gewerbe', label: 'Gewerbeimmobilie' }
                  ]}
                />
                <Button 
                  variant="gradient" 
                  className="w-full" 
                  onClick={calculate}
                  disabled={!input.anschaffungskosten || !input.baujahr}
                >
                  Berechnen
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="vf-calculator-result-panel">
            {!result ? (
              <div className="vf-calculator-result-empty">
                <Percent className="h-16 w-16 mx-auto mb-4" />
                <p>Geben Sie Ihre Daten ein</p>
              </div>
            ) : (
              <CardContent className="p-6">
                <div className="vf-calculator-primary-result">
                  <div className="vf-calculator-primary-label">AfA-Satz</div>
                  <div className="vf-calculator-primary-value">{result.afaSatz}%</div>
                </div>

                <div className="vf-calculator-secondary-results">
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Jährlich</div>
                    <div className="vf-calculator-secondary-value">
                      <CurrencyDisplay amount={result.jahresAfA} />
                    </div>
                  </div>
                  <div className="vf-calculator-secondary-item">
                    <div className="vf-calculator-secondary-label">Monatlich</div>
                    <div className="vf-calculator-secondary-value">
                      <CurrencyDisplay amount={result.monatsAfA} />
                    </div>
                  </div>
                </div>

                <div className="vf-calculator-breakdown">
                  <div className="vf-calculator-breakdown-title">Details</div>
                  <div className="vf-calculator-breakdown-item">
                    <span>Abschreibungsdauer</span>
                    <span>{result.laufzeit} Jahre</span>
                  </div>
                  <div className="vf-calculator-breakdown-item">
                    <span>Rechtsgrundlage</span>
                    <span>§ 7 EStG</span>
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