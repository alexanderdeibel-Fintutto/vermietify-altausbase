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
import { Calculator, Download, Share2 } from 'lucide-react';

export default function CalculatorExample() {
  const [purchasePrice, setPurchasePrice] = useState(300000);
  const [equity, setEquity] = useState(60000);
  const [interestRate, setInterestRate] = useState(3.5);
  const [rentPerMonth, setRentPerMonth] = useState(1200);
  const [result, setResult] = useState(null);
  const [unlocked, setUnlocked] = useState(false);

  const handleCalculate = () => {
    const loanAmount = purchasePrice - equity;
    const monthlyInterest = (loanAmount * interestRate / 100) / 12;
    const annualRent = rentPerMonth * 12;
    const annualInterest = monthlyInterest * 12;
    const netYield = ((annualRent - annualInterest) / purchasePrice) * 100;

    setResult({
      loanAmount,
      monthlyInterest,
      annualRent,
      netYield
    });
  };

  const handleReset = () => {
    setPurchasePrice(300000);
    setEquity(60000);
    setInterestRate(3.5);
    setRentPerMonth(1200);
    setResult(null);
  };

  const handleEmailSubmit = (email) => {
    console.log("Email submitted:", email);
    setTimeout(() => setUnlocked(true), 500);
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
            onReset={handleReset}
          >
            <VfCalculatorInputGroup title="Kaufpreis & Eigenkapital">
              <div>
                <Label>Kaufpreis</Label>
                <Input
                  type="number"
                  value={purchasePrice}
                  onChange={(e) => setPurchasePrice(Number(e.target.value))}
                  placeholder="300.000"
                />
              </div>
              <VfSliderInput
                label="Eigenkapital"
                value={equity}
                onChange={setEquity}
                min={0}
                max={purchasePrice}
                step={5000}
                formatValue={(v) => `${v.toLocaleString('de-DE')} €`}
              />
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Finanzierung & Miete">
              <VfSliderInput
                label="Zinssatz"
                value={interestRate}
                onChange={setInterestRate}
                min={0}
                max={10}
                step={0.1}
                formatValue={(v) => `${v.toFixed(1)}%`}
              />
              <div>
                <Label>Kaltmiete pro Monat</Label>
                <Input
                  type="number"
                  value={rentPerMonth}
                  onChange={(e) => setRentPerMonth(Number(e.target.value))}
                  placeholder="1.200"
                />
              </div>
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
                value: `${result.netYield.toFixed(2)}%`
              } : null}
              secondaryResults={result && unlocked ? [
                { label: "Darlehensbetrag", value: `${result.loanAmount.toLocaleString('de-DE')} €` },
                { label: "Monatliche Zinsen", value: `${result.monthlyInterest.toFixed(2)} €` }
              ] : []}
              breakdown={result && unlocked ? [
                { label: "Jährliche Mieteinnahmen", value: `${result.annualRent.toLocaleString('de-DE')} €`, type: "income" },
                { label: "Jährliche Zinsen", value: `${result.annualInterest.toFixed(2)} €`, type: "expense" }
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