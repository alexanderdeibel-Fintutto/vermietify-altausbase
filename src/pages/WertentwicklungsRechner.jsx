import React, { useState } from 'react';
import { VfCalculatorPage, VfCalculatorForm, VfCalculatorResult } from '@/components/calculators/VfCalculatorPage';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { VfSliderInput } from '@/components/calculators/VfSliderInput';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { TrendingUp } from 'lucide-react';

export default function WertentwicklungsRechner() {
  const [formData, setFormData] = useState({
    aktueller_wert: 300000,
    wertsteigerung_prozent: 2.5,
    jahre: 10
  });
  
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const zukuenftiger_wert = formData.aktueller_wert * Math.pow(1 + formData.wertsteigerung_prozent / 100, formData.jahre);
    const wertzuwachs = zukuenftiger_wert - formData.aktueller_wert;
    const wertzuwachs_prozent = ((zukuenftiger_wert - formData.aktueller_wert) / formData.aktueller_wert) * 100;
    
    setResult({
      zukuenftiger_wert,
      wertzuwachs,
      wertzuwachs_prozent,
      wertzuwachs_jahr: wertzuwachs / formData.jahre
    });
  };

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<TrendingUp className="h-10 w-10" />}
          badge="KOSTENLOS"
          title="Wertentwicklungs-Rechner"
          description="Prognostizieren Sie die Wertentwicklung Ihrer Immobilie"
        />
      }
    >
      <VfCalculatorPage
        inputPanel={
          <VfCalculatorForm
            title="Immobilienwert"
            onCalculate={handleCalculate}
            onReset={() => {
              setFormData({
                aktueller_wert: 300000,
                wertsteigerung_prozent: 2.5,
                jahre: 10
              });
              setResult(null);
            }}
          >
            <VfCalculatorInputGroup title="Aktueller Wert">
              <div>
                <Label>Aktueller Immobilienwert</Label>
                <Input
                  type="number"
                  value={formData.aktueller_wert}
                  onChange={(e) => setFormData({ ...formData, aktueller_wert: Number(e.target.value) })}
                  placeholder="300000"
                />
              </div>
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Prognose">
              <VfSliderInput
                label="Erwartete Wertsteigerung p.a."
                value={formData.wertsteigerung_prozent}
                onChange={(v) => setFormData({ ...formData, wertsteigerung_prozent: v })}
                min={0}
                max={10}
                step={0.5}
                formatValue={(v) => `${v}%`}
              />
              <VfSliderInput
                label="Zeitraum"
                value={formData.jahre}
                onChange={(v) => setFormData({ ...formData, jahre: v })}
                min={1}
                max={30}
                step={1}
                formatValue={(v) => `${v} Jahre`}
              />
            </VfCalculatorInputGroup>
          </VfCalculatorForm>
        }
        resultPanel={
          <VfCalculatorResult
            primaryResult={result ? {
              label: "Wert in " + formData.jahre + " Jahren",
              value: `${result.zukuenftiger_wert.toLocaleString('de-DE')} €`
            } : null}
            secondaryResults={result ? [
              { label: "Wertzuwachs gesamt", value: `${result.wertzuwachs.toLocaleString('de-DE')} €` },
              { label: "Wertzuwachs %", value: `+${result.wertzuwachs_prozent.toFixed(1)}%` }
            ] : []}
            breakdown={result ? [
              { label: "Aktueller Wert", value: `${formData.aktueller_wert.toLocaleString('de-DE')} €` },
              { label: "Ø Wertzuwachs/Jahr", value: `${result.wertzuwachs_jahr.toLocaleString('de-DE')} €` }
            ] : []}
            empty={!result && (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-[var(--theme-text-muted)]" />
                <p className="text-[var(--theme-text-muted)]">
                  Prognostizieren Sie die Wertentwicklung
                </p>
              </div>
            )}
          />
        }
      />
    </VfLeadCapturePage>
  );
}