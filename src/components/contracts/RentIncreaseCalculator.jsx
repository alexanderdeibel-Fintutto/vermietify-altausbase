import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TrendingUp, AlertTriangle, CheckCircle, Calculator } from 'lucide-react';

export default function RentIncreaseCalculator({ contract, building, unit }) {
  const [calculation, setCalculation] = useState(null);
  const [newRent, setNewRent] = useState('');

  const { data: rentIndices = [] } = useQuery({
    queryKey: ['rentIndices', building?.city],
    queryFn: () => base44.entities.RentIndex.filter({ 
      city: building.city,
      wohnlage: unit?.mietspiegel_lage || 'Mittel'
    })
  });

  const { data: previousIncreases = [] } = useQuery({
    queryKey: ['rentChanges', contract?.id],
    queryFn: () => base44.entities.RentChange.filter({ contract_id: contract.id }, '-gueltig_ab', 10),
    enabled: !!contract?.id
  });

  const calculateIncrease = () => {
    const currentRent = contract.kaltmiete;
    const proposedRent = parseFloat(newRent);
    const increase = proposedRent - currentRent;
    const increasePercent = (increase / currentRent * 100).toFixed(2);

    const unitArea = unit?.wohnflaeche_qm || 1;
    const currentPerSqm = currentRent / unitArea;
    const proposedPerSqm = proposedRent / unitArea;

    const relevantIndex = rentIndices.find(idx => 
      (!idx.qm_von || unitArea >= idx.qm_von) &&
      (!idx.qm_bis || unitArea <= idx.qm_bis)
    );

    const checks = {
      within_local_index: relevantIndex 
        ? proposedPerSqm >= relevantIndex.miete_min && proposedPerSqm <= relevantIndex.miete_max
        : null,
      kappungsgrenze_ok: checkKappungsgrenze(previousIncreases, increase, currentRent),
      mietpreisbremse_ok: relevantIndex?.mietpreisbremse_aktiv 
        ? proposedPerSqm <= (relevantIndex.miete_mittel * 1.1)
        : true
    };

    setCalculation({
      currentRent,
      proposedRent,
      increase,
      increasePercent,
      currentPerSqm: currentPerSqm.toFixed(2),
      proposedPerSqm: proposedPerSqm.toFixed(2),
      relevantIndex,
      checks,
      isLegal: checks.kappungsgrenze_ok && checks.mietpreisbremse_ok
    });
  };

  const checkKappungsgrenze = (increases, newIncrease, currentRent) => {
    const threeYearsAgo = new Date();
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    const recentIncreases = increases.filter(inc => 
      new Date(inc.gueltig_ab) >= threeYearsAgo
    );

    const totalIncrease = recentIncreases.reduce((sum, inc) => sum + inc.erhoehung_betrag, 0) + newIncrease;
    const totalPercent = (totalIncrease / currentRent * 100);

    return totalPercent <= 15;
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(amount || 0);
  };

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calculator className="w-5 h-5 text-blue-600" />
          <CardTitle className="text-base">Mieterhöhungs-Rechner (§558 BGB)</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Aktuelle Kaltmiete</Label>
            <Input
              value={formatCurrency(contract?.kaltmiete || 0)}
              disabled
              className="bg-white"
            />
          </div>
          <div>
            <Label className="text-xs">Neue Kaltmiete *</Label>
            <Input
              type="number"
              step="0.01"
              value={newRent}
              onChange={e => setNewRent(e.target.value)}
              placeholder="850.00"
            />
          </div>
        </div>

        <Button 
          size="sm" 
          onClick={calculateIncrease}
          disabled={!newRent}
          className="w-full"
        >
          <TrendingUp className="w-4 h-4 mr-2" />
          Berechnen
        </Button>

        {calculation && (
          <div className="space-y-3 pt-3 border-t">
            {/* Result Summary */}
            <div className="bg-white rounded-lg p-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-slate-600">Erhöhung:</span>
                <span className="font-semibold text-lg text-slate-900">
                  {formatCurrency(calculation.increase)} ({calculation.increasePercent}%)
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">€/m²:</span>
                <span className="text-sm font-medium">
                  {calculation.currentPerSqm} → {calculation.proposedPerSqm} €/m²
                </span>
              </div>
            </div>

            {/* Legal Checks */}
            <div className="space-y-2">
              {calculation.relevantIndex && (
                <Alert className={calculation.checks.within_local_index ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                  {calculation.checks.within_local_index ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription>
                    <p className="text-sm font-medium" style={{ color: calculation.checks.within_local_index ? '#065f46' : '#991b1b' }}>
                      Ortsübliche Vergleichsmiete
                    </p>
                    <p className="text-xs mt-1" style={{ color: calculation.checks.within_local_index ? '#047857' : '#7f1d1d' }}>
                      {calculation.checks.within_local_index 
                        ? `✓ Innerhalb Spanne ${calculation.relevantIndex.miete_min.toFixed(2)} - ${calculation.relevantIndex.miete_max.toFixed(2)} €/m²`
                        : `✗ Außerhalb Spanne ${calculation.relevantIndex.miete_min.toFixed(2)} - ${calculation.relevantIndex.miete_max.toFixed(2)} €/m²`
                      }
                    </p>
                  </AlertDescription>
                </Alert>
              )}

              <Alert className={calculation.checks.kappungsgrenze_ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                {calculation.checks.kappungsgrenze_ok ? (
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                )}
                <AlertDescription>
                  <p className="text-sm font-medium" style={{ color: calculation.checks.kappungsgrenze_ok ? '#065f46' : '#991b1b' }}>
                    15%-Kappungsgrenze (3 Jahre)
                  </p>
                  <p className="text-xs mt-1" style={{ color: calculation.checks.kappungsgrenze_ok ? '#047857' : '#7f1d1d' }}>
                    {calculation.checks.kappungsgrenze_ok 
                      ? '✓ Kappungsgrenze eingehalten'
                      : '✗ Kappungsgrenze überschritten'
                    }
                  </p>
                </AlertDescription>
              </Alert>

              {calculation.relevantIndex?.mietpreisbremse_aktiv && (
                <Alert className={calculation.checks.mietpreisbremse_ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'}>
                  {calculation.checks.mietpreisbremse_ok ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <AlertDescription>
                    <p className="text-sm font-medium" style={{ color: calculation.checks.mietpreisbremse_ok ? '#065f46' : '#991b1b' }}>
                      Mietpreisbremse (§556d BGB)
                    </p>
                    <p className="text-xs mt-1" style={{ color: calculation.checks.mietpreisbremse_ok ? '#047857' : '#7f1d1d' }}>
                      {calculation.checks.mietpreisbremse_ok 
                        ? '✓ Max. 10% über ø Vergleichsmiete eingehalten'
                        : '✗ Mehr als 10% über ø Vergleichsmiete'
                      }
                    </p>
                  </AlertDescription>
                </Alert>
              )}
            </div>

            {/* Final Verdict */}
            {calculation.isLegal ? (
              <Alert className="border-emerald-300 bg-emerald-100">
                <CheckCircle className="w-5 h-5 text-emerald-700" />
                <AlertDescription>
                  <p className="font-semibold text-emerald-900">Mieterhöhung rechtlich zulässig</p>
                  <p className="text-xs text-emerald-800 mt-1">
                    Alle gesetzlichen Voraussetzungen sind erfüllt.
                  </p>
                </AlertDescription>
              </Alert>
            ) : (
              <Alert className="border-red-300 bg-red-100">
                <AlertTriangle className="w-5 h-5 text-red-700" />
                <AlertDescription>
                  <p className="font-semibold text-red-900">Mieterhöhung nicht zulässig</p>
                  <p className="text-xs text-red-800 mt-1">
                    Bitte passen Sie den Betrag an oder warten Sie länger.
                  </p>
                </AlertDescription>
              </Alert>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}