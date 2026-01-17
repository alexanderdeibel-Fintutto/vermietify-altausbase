import React, { useState } from 'react';
import { VfCalculatorPage, VfCalculatorForm, VfCalculatorResult } from '@/components/calculators/VfCalculatorPage';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { VfSliderInput } from '@/components/calculators/VfSliderInput';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Home } from 'lucide-react';

export default function KaufpreisRechner() {
  const [formData, setFormData] = useState({
    jahresmiete: 14400,
    ziel_rendite: 4.5,
    nebenkosten_prozent: 10
  });
  
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const max_kaufpreis = formData.jahresmiete / (formData.ziel_rendite / 100);
    const nebenkosten = max_kaufpreis * (formData.nebenkosten_prozent / 100);
    const budget_gesamt = max_kaufpreis + nebenkosten;
    const kaufpreis_faktor = max_kaufpreis / formData.jahresmiete;
    
    setResult({
      max_kaufpreis,
      nebenkosten,
      budget_gesamt,
      kaufpreis_faktor,
      netto_rendite: (formData.jahresmiete / budget_gesamt) * 100
    });
  };

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<Home className="h-10 w-10" />}
          badge="KOSTENLOS"
          title="Kaufpreis-Rechner"
          description="Ermitteln Sie den maximalen Kaufpreis für Ihre Zielrendite"
        />
      }
    >
      <VfCalculatorPage
        inputPanel={
          <VfCalculatorForm
            title="Investitions-Ziele"
            onCalculate={handleCalculate}
            onReset={() => {
              setFormData({
                jahresmiete: 14400,
                ziel_rendite: 4.5,
                nebenkosten_prozent: 10
              });
              setResult(null);
            }}
          >
            <VfCalculatorInputGroup title="Mietdaten">
              <div>
                <Label>Jahresmiete (Kalt)</Label>
                <Input
                  type="number"
                  value={formData.jahresmiete}
                  onChange={(e) => setFormData({ ...formData, jahresmiete: Number(e.target.value) })}
                  placeholder="14400"
                />
              </div>
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Renditeziel">
              <VfSliderInput
                label="Gewünschte Brutto-Rendite"
                value={formData.ziel_rendite}
                onChange={(v) => setFormData({ ...formData, ziel_rendite: v })}
                min={2}
                max={10}
                step={0.5}
                formatValue={(v) => `${v}%`}
              />
              <VfSliderInput
                label="Kaufnebenkosten"
                value={formData.nebenkosten_prozent}
                onChange={(v) => setFormData({ ...formData, nebenkosten_prozent: v })}
                min={5}
                max={15}
                step={0.5}
                formatValue={(v) => `${v}%`}
              />
            </VfCalculatorInputGroup>
          </VfCalculatorForm>
        }
        resultPanel={
          <VfCalculatorResult
            primaryResult={result ? {
              label: "Max. Kaufpreis",
              value: `${result.max_kaufpreis.toLocaleString('de-DE')} €`
            } : null}
            secondaryResults={result ? [
              { label: "Budget gesamt", value: `${result.budget_gesamt.toLocaleString('de-DE')} €` },
              { label: "Kaufpreisfaktor", value: result.kaufpreis_faktor.toFixed(1) }
            ] : []}
            breakdown={result ? [
              { label: "Kaufpreis", value: `${result.max_kaufpreis.toLocaleString('de-DE')} €` },
              { label: "Nebenkosten", value: `${result.nebenkosten.toLocaleString('de-DE')} €` },
              { label: "Netto-Rendite", value: `${result.netto_rendite.toFixed(2)}%` }
            ] : []}
            empty={!result && (
              <div className="text-center py-8">
                <Home className="h-12 w-12 mx-auto mb-4 text-[var(--theme-text-muted)]" />
                <p className="text-[var(--theme-text-muted)]">
                  Berechnen Sie Ihren maximalen Kaufpreis
                </p>
              </div>
            )}
          />
        }
      />
    </VfLeadCapturePage>
  );
}