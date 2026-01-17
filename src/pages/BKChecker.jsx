import React, { useState } from 'react';
import { VfGenerator } from '@/components/workflows/VfGenerator';
import { VfToolHeader } from '@/components/lead-capture/VfToolHeader';
import { VfLeadCapturePage } from '@/components/lead-capture/VfLeadCapturePage';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { CheckSquare, Upload } from 'lucide-react';

export default function BKChecker() {
  const [formData, setFormData] = useState({
    building_name: '',
    total_costs: 0,
    units_count: 0
  });

  const [preview, setPreview] = useState('');

  const handleCheck = () => {
    const costPerUnit = formData.total_costs / formData.units_count;
    const plausible = costPerUnit >= 50 && costPerUnit <= 500;
    
    const previewText = `
BETRIEBSKOSTEN-CHECK

Objekt: ${formData.building_name}
Gesamtkosten: ${formData.total_costs.toLocaleString('de-DE')} €
Anzahl Einheiten: ${formData.units_count}

Kosten pro Einheit: ${costPerUnit.toFixed(2)} €

Status: ${plausible ? '✅ Plausibel' : '⚠️ Prüfung empfohlen'}

${plausible 
  ? 'Die Betriebskosten liegen im üblichen Rahmen.' 
  : 'Die Kosten weichen vom Durchschnitt ab. Bitte prüfen Sie die Positionen.'}
    `;
    setPreview(previewText);
  };

  return (
    <VfLeadCapturePage
      header={
        <VfToolHeader
          icon={<CheckSquare className="h-10 w-10" />}
          badge="KOSTENLOS"
          title="Betriebskosten-Checker"
          description="Prüfen Sie Ihre Betriebskosten auf Plausibilität"
        />
      }
    >
      <VfGenerator
        form={
          <>
            <VfCalculatorInputGroup title="Objektdaten">
              <div>
                <Label>Objektname</Label>
                <Input
                  value={formData.building_name}
                  onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
                  placeholder="Hauptstraße 1"
                />
              </div>
              <div>
                <Label>Anzahl Einheiten</Label>
                <Input
                  type="number"
                  value={formData.units_count}
                  onChange={(e) => setFormData({ ...formData, units_count: Number(e.target.value) })}
                  placeholder="6"
                />
              </div>
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Betriebskosten">
              <div>
                <Label>Gesamtkosten (Jahr)</Label>
                <Input
                  type="number"
                  value={formData.total_costs}
                  onChange={(e) => setFormData({ ...formData, total_costs: Number(e.target.value) })}
                  placeholder="7200"
                />
              </div>
            </VfCalculatorInputGroup>

            <div className="flex gap-2">
              <Button 
                variant="gradient" 
                className="flex-1"
                onClick={handleCheck}
              >
                Prüfen
              </Button>
              <Button variant="outline">
                <Upload className="h-4 w-4 mr-2" />
                BK-Abrechnung hochladen
              </Button>
            </div>
          </>
        }
        preview={
          preview ? (
            <div className="vf-generator-preview-content whitespace-pre-wrap">
              {preview}
            </div>
          ) : (
            <div className="text-center py-12 text-[var(--theme-text-muted)]">
              <CheckSquare className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Geben Sie Ihre Daten ein, um die Prüfung zu starten</p>
            </div>
          )
        }
      />
    </VfLeadCapturePage>
  );
}