import React, { useState } from 'react';
import { VfCalculatorPage, VfCalculatorForm, VfCalculatorResult } from '@/components/calculators/VfCalculatorPage';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { VfSliderInput } from '@/components/calculators/VfSliderInput';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TrendingDown } from 'lucide-react';

export default function AfACalculator() {
  const [formData, setFormData] = useState({
    purchase_price: 300000,
    land_value: 75000,
    year_built: 2015,
    afa_type: 'linear',
    afa_rate: 2.0
  });
  
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const depreciableBase = formData.purchase_price - formData.land_value;
    const annualAfa = depreciableBase * (formData.afa_rate / 100);
    const yearsTotal = 100 / formData.afa_rate;
    
    setResult({
      depreciableBase,
      annualAfa,
      monthlyAfa: annualAfa / 12,
      yearsTotal,
      remainingValue: depreciableBase - annualAfa
    });
  };

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<TrendingDown className="h-10 w-10" />}
          badge="KOSTENLOS"
          title="AfA-Rechner für Immobilien"
          description="Berechnen Sie die jährliche Abschreibung Ihrer Immobilie"
        />
      }
    >
      <VfCalculatorPage
        inputPanel={
          <VfCalculatorForm
            title="Immobiliendaten"
            onCalculate={handleCalculate}
            onReset={() => {
              setFormData({
                purchase_price: 300000,
                land_value: 75000,
                year_built: 2015,
                afa_type: 'linear',
                afa_rate: 2.0
              });
              setResult(null);
            }}
          >
            <VfCalculatorInputGroup title="Kaufdaten">
              <div>
                <Label>Kaufpreis gesamt</Label>
                <Input
                  type="number"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData({ ...formData, purchase_price: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Grundstückswert</Label>
                <Input
                  type="number"
                  value={formData.land_value}
                  onChange={(e) => setFormData({ ...formData, land_value: Number(e.target.value) })}
                />
                <p className="text-xs text-[var(--theme-text-muted)] mt-1">
                  Ca. 20-30% des Kaufpreises
                </p>
              </div>
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Gebäudedaten">
              <div>
                <Label>Baujahr</Label>
                <Input
                  type="number"
                  value={formData.year_built}
                  onChange={(e) => setFormData({ ...formData, year_built: Number(e.target.value) })}
                  placeholder="2015"
                />
              </div>
              <div>
                <Label>AfA-Methode</Label>
                <Select value={formData.afa_type} onValueChange={(v) => setFormData({ ...formData, afa_type: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Linear</SelectItem>
                    <SelectItem value="degressive">Degressiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </VfCalculatorInputGroup>

            <VfSliderInput
              label="AfA-Satz"
              value={formData.afa_rate}
              onChange={(v) => setFormData({ ...formData, afa_rate: v })}
              min={1.0}
              max={3.0}
              step={0.5}
              formatValue={(v) => `${v}%`}
            />
          </VfCalculatorForm>
        }
        resultPanel={
          <VfCalculatorResult
            primaryResult={result ? {
              label: "Jährliche AfA",
              value: `${result.annualAfa.toLocaleString('de-DE')} €`
            } : null}
            secondaryResults={result ? [
              { label: "Monatlich", value: `${result.monthlyAfa.toLocaleString('de-DE')} €` },
              { label: "Abschreibungsdauer", value: `${Math.round(result.yearsTotal)} Jahre` }
            ] : []}
            breakdown={result ? [
              { label: "Kaufpreis gesamt", value: `${formData.purchase_price.toLocaleString('de-DE')} €` },
              { label: "Grundstückswert", value: `${formData.land_value.toLocaleString('de-DE')} €` },
              { label: "Gebäudewert (AfA-Basis)", value: `${result.depreciableBase.toLocaleString('de-DE')} €` },
              { label: "AfA-Satz", value: `${formData.afa_rate}%` }
            ] : []}
            empty={!result && (
              <div className="text-center py-8">
                <TrendingDown className="h-12 w-12 mx-auto mb-4 text-[var(--theme-text-muted)]" />
                <p className="text-[var(--theme-text-muted)]">
                  Berechnen Sie Ihre jährliche Abschreibung
                </p>
              </div>
            )}
          />
        }
      />
    </VfLeadCapturePage>
  );
}