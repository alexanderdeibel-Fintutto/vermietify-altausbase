import React, { useState } from 'react';
import { VfCalculatorPage, VfCalculatorForm, VfCalculatorResult } from '@/components/calculators/VfCalculatorPage';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { VfSliderInput } from '@/components/calculators/VfSliderInput';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { TrendingUp } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

export default function IndexmietenRechner() {
  const [formData, setFormData] = useState({
    miete_aktuell: 850,
    letzte_anpassung_datum: '2023-01-01',
    schwellenwert: 0
  });
  
  const [result, setResult] = useState(null);

  const calculateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('calculateIndexmiete', data),
    onSuccess: (response) => {
      setResult(response.data.result);
    }
  });

  const handleCalculate = () => {
    calculateMutation.mutate(formData);
  };

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<TrendingUp className="h-10 w-10" />}
          badge="KOSTENLOS"
          title="Indexmieten-Rechner"
          description="Berechnen Sie die mögliche Mietanpassung nach VPI-Entwicklung"
        />
      }
    >
      <VfCalculatorPage
        inputPanel={
          <VfCalculatorForm
            title="Aktuelle Mietdaten"
            onCalculate={handleCalculate}
            onReset={() => {
              setFormData({
                miete_aktuell: 850,
                letzte_anpassung_datum: '2023-01-01',
                schwellenwert: 0
              });
              setResult(null);
            }}
          >
            <VfCalculatorInputGroup title="Mietdaten">
              <div>
                <Label>Aktuelle Kaltmiete</Label>
                <Input
                  type="number"
                  value={formData.miete_aktuell}
                  onChange={(e) => setFormData({ ...formData, miete_aktuell: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Datum der letzten Anpassung</Label>
                <Input
                  type="date"
                  value={formData.letzte_anpassung_datum}
                  onChange={(e) => setFormData({ ...formData, letzte_anpassung_datum: e.target.value })}
                />
              </div>
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Schwellenwert">
              <VfSliderInput
                label="Schwellenwert für Anpassung"
                value={formData.schwellenwert}
                onChange={(v) => setFormData({ ...formData, schwellenwert: v })}
                min={0}
                max={10}
                step={0.5}
                formatValue={(v) => `${v}%`}
              />
              <p className="text-xs text-[var(--theme-text-muted)]">
                0% = Keine Schwelle, Anpassung immer möglich
              </p>
            </VfCalculatorInputGroup>
          </VfCalculatorForm>
        }
        resultPanel={
          <VfCalculatorResult
            primaryResult={result ? {
              label: "Neue Miete",
              value: `${result.neue_miete.toLocaleString('de-DE')} €`
            } : null}
            secondaryResults={result ? [
              { label: "Steigerung", value: `${result.steigerung_prozent}%` },
              { label: "Differenz", value: `+${result.differenz.toLocaleString('de-DE')} €` }
            ] : []}
            breakdown={result ? [
              { label: "Aktuelle Miete", value: `${result.miete_aktuell.toLocaleString('de-DE')} €` },
              { label: "VPI alt", value: result.vpi_alt.toFixed(2) },
              { label: "VPI neu", value: result.vpi_neu.toFixed(2) },
              { label: "Anpassung möglich", value: result.anpassung_moeglich ? 'Ja ✓' : 'Nein ✗' }
            ] : []}
            empty={!result && (
              <div className="text-center py-8">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-[var(--theme-text-muted)]" />
                <p className="text-[var(--theme-text-muted)]">
                  Berechnen Sie die mögliche Mieterhöhung
                </p>
              </div>
            )}
          />
        }
      />
    </VfLeadCapturePage>
  );
}