import React, { useState } from 'react';
import { VfCalculatorPage, VfCalculatorForm, VfCalculatorResult } from '@/components/calculators/VfCalculatorPage';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { VfSliderInput } from '@/components/calculators/VfSliderInput';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { VfEmailGate } from '@/components/lead-capture/VfEmailGate';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { base44 } from '@/api/base44Client';
import { Calculator, Download, Share2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';

export default function RenditeRechner() {
  const [formData, setFormData] = useState({
    kaufpreis: 300000,
    nebenkosten_prozent: 10,
    miete_kalt_monat: 1200,
    nicht_umlagefaehig_monat: 150,
    eigenkapital: 60000,
    zinssatz: 3.5
  });
  
  const [result, setResult] = useState(null);
  const [unlocked, setUnlocked] = useState(false);
  const [leadId, setLeadId] = useState(null);

  const calculateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('calculateRendite', data),
    onSuccess: (response) => {
      setResult(response.data.result);
    }
  });

  const leadMutation = useMutation({
    mutationFn: (email) => base44.functions.invoke('captureLead', {
      email,
      source: 'rendite_rechner',
      marketing_consent: true
    }),
    onSuccess: (response) => {
      setLeadId(response.data.lead_id);
      setUnlocked(true);
    }
  });

  const handleCalculate = () => {
    calculateMutation.mutate(formData);
  };

  const handleEmailSubmit = (email) => {
    leadMutation.mutate(email);
  };

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<Calculator className="h-10 w-10" />}
          badge="KOSTENLOS"
          title="Rendite-Rechner für Immobilien"
          description="Berechnen Sie die Netto-Rendite Ihrer Immobilieninvestition in Sekunden"
        />
      }
    >
      <VfCalculatorPage
        inputPanel={
          <VfCalculatorForm
            title="Ihre Investitionsdaten"
            onCalculate={handleCalculate}
            onReset={() => {
              setFormData({
                kaufpreis: 300000,
                nebenkosten_prozent: 10,
                miete_kalt_monat: 1200,
                nicht_umlagefaehig_monat: 150,
                eigenkapital: 60000,
                zinssatz: 3.5
              });
              setResult(null);
            }}
          >
            <VfCalculatorInputGroup title="Kaufpreis & Nebenkosten">
              <div>
                <Label>Kaufpreis</Label>
                <Input
                  type="number"
                  value={formData.kaufpreis}
                  onChange={(e) => setFormData({ ...formData, kaufpreis: Number(e.target.value) })}
                />
              </div>
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

            <VfCalculatorInputGroup title="Miete & Kosten">
              <div>
                <Label>Kaltmiete pro Monat</Label>
                <Input
                  type="number"
                  value={formData.miete_kalt_monat}
                  onChange={(e) => setFormData({ ...formData, miete_kalt_monat: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Nicht umlagefähige Kosten pro Monat</Label>
                <Input
                  type="number"
                  value={formData.nicht_umlagefaehig_monat}
                  onChange={(e) => setFormData({ ...formData, nicht_umlagefaehig_monat: Number(e.target.value) })}
                />
              </div>
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Finanzierung">
              <VfSliderInput
                label="Eigenkapital"
                value={formData.eigenkapital}
                onChange={(v) => setFormData({ ...formData, eigenkapital: v })}
                min={0}
                max={formData.kaufpreis}
                step={5000}
                formatValue={(v) => `${v.toLocaleString('de-DE')} €`}
              />
              <VfSliderInput
                label="Zinssatz"
                value={formData.zinssatz}
                onChange={(v) => setFormData({ ...formData, zinssatz: v })}
                min={0}
                max={10}
                step={0.1}
                formatValue={(v) => `${v.toFixed(1)}%`}
              />
            </VfCalculatorInputGroup>
          </VfCalculatorForm>
        }
        resultPanel={
          !unlocked && result ? (
            <div className="vf-calculator-result-panel">
              <VfEmailGate
                title="Vollständiges Ergebnis freischalten"
                description="Erhalten Sie Ihre detaillierte Rendite-Analyse kostenlos per E-Mail"
                onSubmit={handleEmailSubmit}
              />
            </div>
          ) : (
            <VfCalculatorResult
              primaryResult={result && unlocked ? {
                label: "Netto-Rendite",
                value: `${result.netto_rendite}%`
              } : null}
              secondaryResults={result && unlocked ? [
                { label: "Brutto-Rendite", value: `${result.brutto_rendite}%` },
                { label: "EK-Rendite", value: `${result.eigenkapital_rendite}%` },
                { label: "Kaufpreisfaktor", value: result.kaufpreis_faktor }
              ] : []}
              breakdown={result && unlocked ? [
                { label: "Jahresmiete brutto", value: `${result.jahresmiete_brutto.toLocaleString('de-DE')} €`, type: "income" },
                { label: "Jahresmiete netto", value: `${result.jahresmiete_netto.toLocaleString('de-DE')} €`, type: "income" },
                { label: "Gesamtkosten", value: `${result.gesamtkosten.toLocaleString('de-DE')} €`, type: "expense" },
                { label: "Zinskosten/Jahr", value: `${(result.monatliche_zinskosten * 12).toLocaleString('de-DE')} €`, type: "expense" }
              ] : []}
              actions={result && unlocked && (
                <>
                  <Button variant="outline" size="sm">
                    <Download className="h-4 w-4 mr-2" />
                    PDF
                  </Button>
                  <Button variant="outline" size="sm">
                    <Share2 className="h-4 w-4 mr-2" />
                    Teilen
                  </Button>
                </>
              )}
              empty={!result && (
                <div className="text-center py-8">
                  <Calculator className="h-12 w-12 mx-auto mb-4 text-[var(--theme-text-muted)]" />
                  <p className="text-[var(--theme-text-muted)]">
                    Füllen Sie das Formular aus und klicken Sie auf "Berechnen"
                  </p>
                </div>
              )}
            />
          )
        }
      />
    </VfLeadCapturePage>
  );
}