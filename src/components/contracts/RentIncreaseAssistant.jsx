import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { base44 } from '@/api/base44Client';
import { Loader2, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export default function RentIncreaseAssistant({ leaseContractId, lease }) {
  const [step, setStep] = useState('method'); // method -> calculate -> preview
  const [loading, setLoading] = useState(false);
  const [calculationMethod, setCalculationMethod] = useState('INDEX');
  const [calculation, setCalculation] = useState(null);
  const [proposal, setProposal] = useState(null);
  const [inputs, setInputs] = useState({
    indexValue: '',
    marketRent: '',
    percentageIncrease: ''
  });

  const handleCalculate = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('calculateRentIncrease', {
        leaseContractId,
        calculationMethod,
        indexValue: calculationMethod === 'INDEX' ? parseFloat(inputs.indexValue) : null,
        marketRent: calculationMethod === 'MARKET' ? parseFloat(inputs.marketRent) : null,
        percentageIncrease: calculationMethod === 'PERCENTAGE' ? parseFloat(inputs.percentageIncrease) : null
      });

      setCalculation(response.data);
      setStep('preview');
      toast.success('Mieterhöhung berechnet');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async () => {
    setLoading(true);
    try {
      const proposal = await base44.entities.RentIncreaseProposal.create({
        lease_contract_id: leaseContractId,
        unit_id: lease.unit_id,
        tenant_email: lease.tenant_email,
        current_rent: lease.rent_amount,
        new_rent: calculation.newRent,
        increase_amount: calculation.increaseAmount,
        increase_percentage: calculation.increasePercentage,
        calculation_method: calculationMethod,
        index_value: inputs.indexValue || null,
        market_rent: inputs.marketRent || null,
        notice_date: calculation.noticeDate,
        effective_date: calculation.effectiveDate,
        status: 'DRAFT'
      });

      setProposal(proposal);
      toast.success('Mieterhöhungsantrag erstellt');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateLetter = async () => {
    setLoading(true);
    try {
      const response = await base44.functions.invoke('generateRentIncreaseLetter', {
        proposalId: proposal.id
      });

      // Letter herunterladen
      const element = document.createElement('a');
      const file = new Blob([response.data.letterContent], { type: 'text/html' });
      element.href = URL.createObjectURL(file);
      element.download = `Mieterhohung_${proposal.id}.html`;
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);

      toast.success('Anschreiben heruntergeladen');
    } catch (error) {
      toast.error('Fehler: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {step === 'method' && (
        <Card>
          <CardHeader>
            <CardTitle>Mieterhöhungs-Assistent</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-600">
              Aktuelle Miete: <strong>€{lease.rent_amount?.toFixed(2)}/Monat</strong>
            </p>

            <div>
              <label className="block text-sm font-medium mb-2">Berechnungsmethode</label>
              <div className="space-y-2">
                {[
                  { value: 'INDEX', label: 'Nach Mietindex (empfohlen)' },
                  { value: 'PERCENTAGE', label: 'Prozentuale Erhöhung' },
                  { value: 'MARKET', label: 'Nach Vergleichsmiete' }
                ].map(method => (
                  <label key={method.value} className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      value={method.value}
                      checked={calculationMethod === method.value}
                      onChange={(e) => setCalculationMethod(e.target.value)}
                    />
                    {method.label}
                  </label>
                ))}
              </div>
            </div>

            {calculationMethod === 'INDEX' && (
              <Input
                type="number"
                step="0.1"
                placeholder="z.B. 2.5 für 2,5% Indexsteigerung"
                value={inputs.indexValue}
                onChange={(e) => setInputs({ ...inputs, indexValue: e.target.value })}
                label="Mietindex (%)"
              />
            )}

            {calculationMethod === 'PERCENTAGE' && (
              <Input
                type="number"
                step="0.1"
                placeholder="z.B. 5 für 5% Erhöhung"
                value={inputs.percentageIncrease}
                onChange={(e) => setInputs({ ...inputs, percentageIncrease: e.target.value })}
                label="Erhöhung (%)"
              />
            )}

            {calculationMethod === 'MARKET' && (
              <Input
                type="number"
                step="0.01"
                placeholder="z.B. 850.00"
                value={inputs.marketRent}
                onChange={(e) => setInputs({ ...inputs, marketRent: e.target.value })}
                label="Ortsübliche Vergleichsmiete (€)"
              />
            )}

            <div className="flex gap-2 pt-4">
              <Button onClick={handleCalculate} disabled={loading} className="flex-1 bg-blue-600 hover:bg-blue-700">
                {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Berechnen
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 'preview' && calculation && !proposal && (
        <div className="space-y-3">
          <Card className={calculation.legalValidation.meetsLegalLimits ? 'bg-green-50' : 'bg-yellow-50'}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {calculation.legalValidation.meetsLegalLimits ? '✓' : '⚠'} Berechnungsergebnis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-gray-600">Aktuelle Miete</p>
                  <p className="font-semibold">€{calculation.currentRent.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Neue Miete</p>
                  <p className="font-semibold text-lg">€{calculation.newRent.toFixed(2)}</p>
                </div>
              </div>

              <div className="bg-white p-3 rounded border-l-4 border-blue-400">
                <p className="text-sm"><strong>Erhöhung:</strong> €{calculation.increaseAmount.toFixed(2)}/Monat ({calculation.increasePercentage.toFixed(1)}%)</p>
              </div>

              <div className="space-y-1 text-sm">
                <p><strong>Inkrafttrittsdatum:</strong> {new Date(calculation.effectiveDate).toLocaleDateString('de-DE')}</p>
                <p><strong>Kündigungsfrist-Start:</strong> {new Date(calculation.noticeDate).toLocaleDateString('de-DE')}</p>
              </div>

              {calculation.legalValidation.warning && (
                <div className="flex gap-2 p-3 bg-yellow-100 text-yellow-800 rounded text-sm">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <p>{calculation.legalValidation.warning}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button onClick={handleCreateProposal} disabled={loading} className="w-full bg-green-600 hover:bg-green-700">
            {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            Antrag erstellen
          </Button>
        </div>
      )}

      {proposal && (
        <Card className="bg-green-50">
          <CardHeader>
            <CardTitle>Mieterhöhungsantrag erstellt ✓</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-gray-700">
              Der Antrag wurde erstellt. Generieren Sie nun das offizielle Anschreiben für die Mieterin.
            </p>

            <Button onClick={handleGenerateLetter} disabled={loading} className="w-full">
              {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              <FileText className="w-4 h-4 mr-2" />
              Anschreiben generieren
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}