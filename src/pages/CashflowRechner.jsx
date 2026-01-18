import React, { useState } from 'react';
import { VfInput } from '@/components/shared/VfInput';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { PieChart } from 'lucide-react';
import CurrencyDisplay from '@/components/shared/CurrencyDisplay';

export default function CashflowRechner() {
  const [input, setInput] = useState({
    miete_kalt: '',
    nebenkosten_vorauszahlung: '',
    verwaltungskosten: '',
    instandhaltung: '',
    nicht_umlagefaehig: '',
    finanzierungskosten: ''
  });

  const calculate = () => {
    const mieteinnahmen = (parseFloat(input.miete_kalt) || 0) * 12;
    const nebenkostenVZ = (parseFloat(input.nebenkosten_vorauszahlung) || 0) * 12;
    const verwaltung = (parseFloat(input.verwaltungskosten) || 0) * 12;
    const instandhaltung = (parseFloat(input.instandhaltung) || 0) * 12;
    const nichtUmlagefaehig = (parseFloat(input.nicht_umlagefaehig) || 0) * 12;
    const finanzierung = (parseFloat(input.finanzierungskosten) || 0) * 12;

    const gesamtEinnahmen = mieteinnahmen + nebenkostenVZ;
    const gesamtAusgaben = verwaltung + instandhaltung + nichtUmlagefaehig + finanzierung;
    const cashflow = gesamtEinnahmen - gesamtAusgaben;

    return {
      gesamtEinnahmen,
      gesamtAusgaben,
      cashflowJahr: cashflow,
      cashflowMonat: cashflow / 12,
      positiv: cashflow > 0
    };
  };

  const result = calculate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[var(--vf-primary-50)] to-white p-6">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <div className="vf-tool-icon mx-auto mb-4">
            <PieChart className="h-9 w-9" />
          </div>
          <h1 className="vf-tool-title">Cashflow-Rechner</h1>
          <p className="vf-tool-description">
            Berechnen Sie den monatlichen und jährlichen Cashflow Ihrer Immobilie
          </p>
        </div>

        <div className="vf-calculator">
          <Card className="vf-calculator-input-panel">
            <CardHeader>
              <CardTitle>Einnahmen & Ausgaben</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="font-semibold text-[var(--vf-success-700)] mb-2">Einnahmen (monatlich)</div>
                <VfInput
                  label="Kaltmiete"
                  type="number"
                  rightAddon="€"
                  value={input.miete_kalt}
                  onChange={(e) => setInput({ ...input, miete_kalt: e.target.value })}
                />
                <VfInput
                  label="Nebenkosten-Vorauszahlung"
                  type="number"
                  rightAddon="€"
                  value={input.nebenkosten_vorauszahlung}
                  onChange={(e) => setInput({ ...input, nebenkosten_vorauszahlung: e.target.value })}
                />

                <div className="font-semibold text-[var(--vf-error-700)] mb-2 mt-6">Ausgaben (monatlich)</div>
                <VfInput
                  label="Verwaltungskosten"
                  type="number"
                  rightAddon="€"
                  value={input.verwaltungskosten}
                  onChange={(e) => setInput({ ...input, verwaltungskosten: e.target.value })}
                />
                <VfInput
                  label="Instandhaltungsrücklage"
                  type="number"
                  rightAddon="€"
                  value={input.instandhaltung}
                  onChange={(e) => setInput({ ...input, instandhaltung: e.target.value })}
                />
                <VfInput
                  label="Nicht-umlagefähige NK"
                  type="number"
                  rightAddon="€"
                  value={input.nicht_umlagefaehig}
                  onChange={(e) => setInput({ ...input, nicht_umlagefaehig: e.target.value })}
                />
                <VfInput
                  label="Finanzierungskosten"
                  type="number"
                  rightAddon="€"
                  value={input.finanzierungskosten}
                  onChange={(e) => setInput({ ...input, finanzierungskosten: e.target.value })}
                />
              </div>
            </CardContent>
          </Card>

          <Card className="vf-calculator-result-panel">
            <CardContent className="p-6">
              <div className="vf-calculator-primary-result">
                <div className="vf-calculator-primary-label">Cashflow (Monat)</div>
                <div className={`vf-calculator-primary-value ${
                  result.positiv ? 'text-[var(--vf-success-600)]' : 'text-[var(--vf-error-600)]'
                }`}>
                  <CurrencyDisplay amount={result.cashflowMonat} showSign color={result.positiv} />
                </div>
              </div>

              <div className="vf-calculator-secondary-results">
                <div className="vf-calculator-secondary-item">
                  <div className="vf-calculator-secondary-label">Cashflow (Jahr)</div>
                  <div className={`vf-calculator-secondary-value ${
                    result.positiv ? 'text-[var(--vf-success-600)]' : 'text-[var(--vf-error-600)]'
                  }`}>
                    <CurrencyDisplay amount={result.cashflowJahr} showSign color={result.positiv} />
                  </div>
                </div>
              </div>

              <div className="vf-calculator-breakdown">
                <div className="vf-calculator-breakdown-title">Zusammenfassung (Jahr)</div>
                <div className="vf-calculator-breakdown-item">
                  <span className="text-[var(--vf-success-700)]">Einnahmen</span>
                  <CurrencyDisplay amount={result.gesamtEinnahmen} />
                </div>
                <div className="vf-calculator-breakdown-item">
                  <span className="text-[var(--vf-error-700)]">Ausgaben</span>
                  <CurrencyDisplay amount={result.gesamtAusgaben} />
                </div>
                <div className="vf-calculator-breakdown-item border-t-2 border-[var(--vf-neutral-300)] pt-2 mt-2 font-bold">
                  <span>Cashflow</span>
                  <CurrencyDisplay amount={result.cashflowJahr} showSign color={result.positiv} />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}