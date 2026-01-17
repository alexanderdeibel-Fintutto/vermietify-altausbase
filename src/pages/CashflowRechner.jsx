import React, { useState } from 'react';
import { VfCalculatorPage, VfCalculatorForm, VfCalculatorResult } from '@/components/calculators/VfCalculatorPage';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { DollarSign } from 'lucide-react';

export default function CashflowRechner() {
  const [formData, setFormData] = useState({
    miete_kalt: 1000,
    nebenkosten_umlage: 150,
    nicht_umlagefaehig: 100,
    instandhaltung: 50,
    verwaltung: 30,
    versicherung: 40,
    grundsteuer: 60,
    zinskosten: 500
  });
  
  const [result, setResult] = useState(null);

  const handleCalculate = () => {
    const einnahmen = formData.miete_kalt + formData.nebenkosten_umlage;
    const ausgaben = formData.nicht_umlagefaehig + formData.instandhaltung + 
                     formData.verwaltung + formData.versicherung + 
                     formData.grundsteuer + formData.zinskosten;
    
    const cashflow = einnahmen - ausgaben;
    const cashflow_jahr = cashflow * 12;
    
    setResult({
      einnahmen_monat: einnahmen,
      ausgaben_monat: ausgaben,
      cashflow_monat: cashflow,
      cashflow_jahr,
      rendite_status: cashflow > 0 ? 'Positiv' : 'Negativ'
    });
  };

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<DollarSign className="h-10 w-10" />}
          badge="KOSTENLOS"
          title="Cashflow-Rechner"
          description="Berechnen Sie Ihren monatlichen und jährlichen Cashflow"
        />
      }
    >
      <VfCalculatorPage
        inputPanel={
          <VfCalculatorForm
            title="Einnahmen & Ausgaben"
            onCalculate={handleCalculate}
            onReset={() => {
              setFormData({
                miete_kalt: 1000,
                nebenkosten_umlage: 150,
                nicht_umlagefaehig: 100,
                instandhaltung: 50,
                verwaltung: 30,
                versicherung: 40,
                grundsteuer: 60,
                zinskosten: 500
              });
              setResult(null);
            }}
          >
            <VfCalculatorInputGroup title="Einnahmen">
              <div>
                <Label>Kaltmiete</Label>
                <Input
                  type="number"
                  value={formData.miete_kalt}
                  onChange={(e) => setFormData({ ...formData, miete_kalt: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Nebenkosten-Umlage</Label>
                <Input
                  type="number"
                  value={formData.nebenkosten_umlage}
                  onChange={(e) => setFormData({ ...formData, nebenkosten_umlage: Number(e.target.value) })}
                />
              </div>
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Laufende Ausgaben">
              <div>
                <Label>Nicht umlagefähige NK</Label>
                <Input
                  type="number"
                  value={formData.nicht_umlagefaehig}
                  onChange={(e) => setFormData({ ...formData, nicht_umlagefaehig: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Instandhaltung</Label>
                <Input
                  type="number"
                  value={formData.instandhaltung}
                  onChange={(e) => setFormData({ ...formData, instandhaltung: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Verwaltung</Label>
                <Input
                  type="number"
                  value={formData.verwaltung}
                  onChange={(e) => setFormData({ ...formData, verwaltung: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Versicherung</Label>
                <Input
                  type="number"
                  value={formData.versicherung}
                  onChange={(e) => setFormData({ ...formData, versicherung: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Grundsteuer</Label>
                <Input
                  type="number"
                  value={formData.grundsteuer}
                  onChange={(e) => setFormData({ ...formData, grundsteuer: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label>Zinskosten</Label>
                <Input
                  type="number"
                  value={formData.zinskosten}
                  onChange={(e) => setFormData({ ...formData, zinskosten: Number(e.target.value) })}
                />
              </div>
            </VfCalculatorInputGroup>
          </VfCalculatorForm>
        }
        resultPanel={
          <VfCalculatorResult
            primaryResult={result ? {
              label: "Cashflow pro Monat",
              value: `${result.cashflow_monat.toLocaleString('de-DE')} €`
            } : null}
            secondaryResults={result ? [
              { label: "Cashflow pro Jahr", value: `${result.cashflow_jahr.toLocaleString('de-DE')} €` },
              { label: "Status", value: result.rendite_status }
            ] : []}
            breakdown={result ? [
              { label: "Einnahmen/Monat", value: `${result.einnahmen_monat.toLocaleString('de-DE')} €`, type: "income" },
              { label: "Ausgaben/Monat", value: `${result.ausgaben_monat.toLocaleString('de-DE')} €`, type: "expense" }
            ] : []}
            empty={!result && (
              <div className="text-center py-8">
                <DollarSign className="h-12 w-12 mx-auto mb-4 text-[var(--theme-text-muted)]" />
                <p className="text-[var(--theme-text-muted)]">
                  Berechnen Sie Ihren Cashflow
                </p>
              </div>
            )}
          />
        }
      />
    </VfLeadCapturePage>
  );
}