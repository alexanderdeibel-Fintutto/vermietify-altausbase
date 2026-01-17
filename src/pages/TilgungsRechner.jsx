import React, { useState } from 'react';
import { VfCalculatorPage, VfCalculatorForm, VfCalculatorResult } from '@/components/calculators/VfCalculatorPage';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { VfSliderInput } from '@/components/calculators/VfSliderInput';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { PiggyBank } from 'lucide-react';

export default function TilgungsRechner() {
  const [formData, setFormData] = useState({
    darlehensbetrag: 250000,
    zinssatz: 3.5,
    tilgungssatz: 2.0,
    sondertilgung_jahr: 0
  });
  
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const zinsen_jahr = formData.darlehensbetrag * (formData.zinssatz / 100);
    const tilgung_jahr = formData.darlehensbetrag * (formData.tilgungssatz / 100);
    const rate_monat = (zinsen_jahr + tilgung_jahr) / 12;
    
    // Simplified calculation
    const tilgung_jahr_gesamt = tilgung_jahr + formData.sondertilgung_jahr;
    const laufzeit_jahre = Math.ceil(formData.darlehensbetrag / tilgung_jahr_gesamt);
    
    setResult({
      rate_monat,
      zinsen_jahr,
      tilgung_jahr,
      laufzeit_jahre,
      restschuld_5_jahre: Math.max(0, formData.darlehensbetrag - (tilgung_jahr_gesamt * 5)),
      restschuld_10_jahre: Math.max(0, formData.darlehensbetrag - (tilgung_jahr_gesamt * 10))
    });
  };

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<PiggyBank className="h-10 w-10" />}
          badge="KOSTENLOS"
          title="Tilgungsrechner"
          description="Berechnen Sie Ihre monatliche Rate und Laufzeit"
        />
      }
    >
      <VfCalculatorPage
        inputPanel={
          <VfCalculatorForm
            title="Darlehensdaten"
            onCalculate={handleCalculate}
            onReset={() => {
              setFormData({
                darlehensbetrag: 250000,
                zinssatz: 3.5,
                tilgungssatz: 2.0,
                sondertilgung_jahr: 0
              });
              setResult(null);
            }}
          >
            <VfCalculatorInputGroup title="Darlehen">
              <div>
                <Label>Darlehensbetrag</Label>
                <Input
                  type="number"
                  value={formData.darlehensbetrag}
                  onChange={(e) => setFormData({ ...formData, darlehensbetrag: Number(e.target.value) })}
                />
              </div>
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Konditionen">
              <VfSliderInput
                label="Zinssatz"
                value={formData.zinssatz}
                onChange={(v) => setFormData({ ...formData, zinssatz: v })}
                min={0.5}
                max={10}
                step={0.1}
                formatValue={(v) => `${v.toFixed(1)}%`}
              />
              <VfSliderInput
                label="Tilgungssatz"
                value={formData.tilgungssatz}
                onChange={(v) => setFormData({ ...formData, tilgungssatz: v })}
                min={1}
                max={10}
                step={0.5}
                formatValue={(v) => `${v}%`}
              />
              <VfSliderInput
                label="Sondertilgung pro Jahr"
                value={formData.sondertilgung_jahr}
                onChange={(v) => setFormData({ ...formData, sondertilgung_jahr: v })}
                min={0}
                max={50000}
                step={1000}
                formatValue={(v) => `${v.toLocaleString('de-DE')} €`}
              />
            </VfCalculatorInputGroup>
          </VfCalculatorForm>
        }
        resultPanel={
          <VfCalculatorResult
            primaryResult={result ? {
              label: "Monatliche Rate",
              value: `${result.rate_monat.toLocaleString('de-DE')} €`
            } : null}
            secondaryResults={result ? [
              { label: "Laufzeit", value: `${result.laufzeit_jahre} Jahre` },
              { label: "Zinsen/Jahr", value: `${result.zinsen_jahr.toLocaleString('de-DE')} €` }
            ] : []}
            breakdown={result ? [
              { label: "Tilgung/Jahr", value: `${result.tilgung_jahr.toLocaleString('de-DE')} €` },
              { label: "Restschuld nach 5 Jahren", value: `${result.restschuld_5_jahre.toLocaleString('de-DE')} €` },
              { label: "Restschuld nach 10 Jahren", value: `${result.restschuld_10_jahre.toLocaleString('de-DE')} €` }
            ] : []}
            empty={!result && (
              <div className="text-center py-8">
                <PiggyBank className="h-12 w-12 mx-auto mb-4 text-[var(--theme-text-muted)]" />
                <p className="text-[var(--theme-text-muted)]">
                  Berechnen Sie Ihre Tilgung
                </p>
              </div>
            )}
          />
        }
      />
    </VfLeadCapturePage>
  );
}