import React, { useState } from 'react';
import { VfWizard } from '@/components/workflows/VfWizard';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { VfSliderInput } from '@/components/calculators/VfSliderInput';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

export function MietvertragWizard({ unitId, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    unit_id: unitId || '',
    tenant_first_name: '',
    tenant_last_name: '',
    tenant_email: '',
    contract_start: '',
    contract_end: '',
    base_rent: 0,
    operating_costs: 0,
    heating_costs: 0,
    deposit_months: 3,
    indexmiete_enabled: false,
    indexmiete_threshold: 5,
    kleinreparaturen_enabled: true,
    haustiere: 'kleintiere'
  });

  const { data: units = [] } = useQuery({
    queryKey: ['units'],
    queryFn: () => base44.entities.Unit.list()
  });

  const steps = [
    { id: 'unit', label: 'Wohnung', title: 'Wohnung auswählen', description: 'Wählen Sie die zu vermietende Wohnung' },
    { id: 'tenant', label: 'Mieter', title: 'Mieter erfassen', description: 'Erfassen Sie die Mieterdaten' },
    { id: 'dates', label: 'Termine', title: 'Vertragsdaten', description: 'Legen Sie die Vertragsdaten fest' },
    { id: 'rent', label: 'Miete', title: 'Miete & Nebenkosten', description: 'Definieren Sie die Miete' },
    { id: 'deposit', label: 'Kaution', title: 'Kaution', description: 'Kautionsvereinbarung' },
    { id: 'clauses', label: 'Klauseln', title: 'Klauseln', description: 'Zusätzliche Vereinbarungen' },
    { id: 'preview', label: 'Vorschau', title: 'Vorschau', description: 'Vertrag prüfen' }
  ];

  const totalRent = formData.base_rent + formData.operating_costs + formData.heating_costs;
  const maxDeposit = formData.base_rent * 3;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <VfWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      >
        {currentStep === 0 && (
          <VfCalculatorInputGroup title="Wohnung auswählen">
            <Select value={formData.unit_id} onValueChange={(v) => setFormData({ ...formData, unit_id: v })}>
              <SelectTrigger>
                <SelectValue placeholder="Wählen Sie eine Wohnung" />
              </SelectTrigger>
              <SelectContent>
                {units.filter(u => u.status === 'leer').map((unit) => (
                  <SelectItem key={unit.id} value={unit.id}>
                    {unit.unit_number} - {unit.sqm} m², {unit.rooms} Zimmer
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </VfCalculatorInputGroup>
        )}

        {currentStep === 1 && (
          <>
            <VfCalculatorInputGroup title="Persönliche Daten">
              <div>
                <Label>Vorname</Label>
                <Input
                  value={formData.tenant_first_name}
                  onChange={(e) => setFormData({ ...formData, tenant_first_name: e.target.value })}
                  placeholder="Max"
                />
              </div>
              <div>
                <Label>Nachname</Label>
                <Input
                  value={formData.tenant_last_name}
                  onChange={(e) => setFormData({ ...formData, tenant_last_name: e.target.value })}
                  placeholder="Mustermann"
                />
              </div>
              <div>
                <Label>E-Mail</Label>
                <Input
                  type="email"
                  value={formData.tenant_email}
                  onChange={(e) => setFormData({ ...formData, tenant_email: e.target.value })}
                  placeholder="max@example.com"
                />
              </div>
            </VfCalculatorInputGroup>
          </>
        )}

        {currentStep === 2 && (
          <VfCalculatorInputGroup title="Vertragslaufzeit">
            <div>
              <Label>Vertragsbeginn</Label>
              <Input
                type="date"
                value={formData.contract_start}
                onChange={(e) => setFormData({ ...formData, contract_start: e.target.value })}
              />
            </div>
            <div>
              <Label>Vertragsende (leer = unbefristet)</Label>
              <Input
                type="date"
                value={formData.contract_end}
                onChange={(e) => setFormData({ ...formData, contract_end: e.target.value })}
              />
            </div>
          </VfCalculatorInputGroup>
        )}

        {currentStep === 3 && (
          <VfCalculatorInputGroup title="Miete & Nebenkosten">
            <div>
              <Label>Kaltmiete</Label>
              <Input
                type="number"
                value={formData.base_rent}
                onChange={(e) => setFormData({ ...formData, base_rent: Number(e.target.value) })}
                placeholder="850"
              />
            </div>
            <div>
              <Label>Nebenkosten-Vorauszahlung</Label>
              <Input
                type="number"
                value={formData.operating_costs}
                onChange={(e) => setFormData({ ...formData, operating_costs: Number(e.target.value) })}
                placeholder="120"
              />
            </div>
            <div>
              <Label>Heizkosten-Vorauszahlung</Label>
              <Input
                type="number"
                value={formData.heating_costs}
                onChange={(e) => setFormData({ ...formData, heating_costs: Number(e.target.value) })}
                placeholder="80"
              />
            </div>
            <div className="col-span-2 p-4 bg-[var(--theme-surface)] rounded-lg">
              <div className="flex justify-between font-semibold">
                <span>Warmmiete gesamt:</span>
                <span>{totalRent.toLocaleString('de-DE')} €</span>
              </div>
            </div>
          </VfCalculatorInputGroup>
        )}

        {currentStep === 4 && (
          <VfCalculatorInputGroup title="Kaution">
            <VfSliderInput
              label="Kaution (in Monatsmieten)"
              value={formData.deposit_months}
              onChange={(v) => setFormData({ ...formData, deposit_months: v })}
              min={0}
              max={3}
              step={0.5}
              formatValue={(v) => `${v} Monate (${(v * formData.base_rent).toLocaleString('de-DE')} €)`}
            />
            {formData.deposit_months * formData.base_rent > maxDeposit && (
              <div className="vf-alert vf-alert-warning">
                <div className="vf-alert-title">Warnung</div>
                <div className="vf-alert-description">
                  Kaution überschreitet das gesetzliche Maximum von 3 Monatsmieten
                </div>
              </div>
            )}
          </VfCalculatorInputGroup>
        )}

        {currentStep === 5 && (
          <div className="space-y-4">
            <VfCalculatorInputGroup title="Mietanpassung">
              <label className="flex items-center gap-3">
                <Checkbox 
                  checked={formData.indexmiete_enabled}
                  onCheckedChange={(v) => setFormData({ ...formData, indexmiete_enabled: v })}
                />
                <span>Indexmiete vereinbaren</span>
              </label>
              {formData.indexmiete_enabled && (
                <VfSliderInput
                  label="Schwellenwert"
                  value={formData.indexmiete_threshold}
                  onChange={(v) => setFormData({ ...formData, indexmiete_threshold: v })}
                  min={0}
                  max={10}
                  step={0.5}
                  formatValue={(v) => `${v}%`}
                />
              )}
            </VfCalculatorInputGroup>

            <VfCalculatorInputGroup title="Sonstige Klauseln">
              <label className="flex items-center gap-3">
                <Checkbox 
                  checked={formData.kleinreparaturen_enabled}
                  onCheckedChange={(v) => setFormData({ ...formData, kleinreparaturen_enabled: v })}
                />
                <span>Kleinreparaturklausel (max. 100€/Einzelfall)</span>
              </label>
              
              <div>
                <Label>Haustiere</Label>
                <Select value={formData.haustiere} onValueChange={(v) => setFormData({ ...formData, haustiere: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="erlaubt">Erlaubt</SelectItem>
                    <SelectItem value="kleintiere">Nur Kleintiere</SelectItem>
                    <SelectItem value="zustimmung">Mit Zustimmung</SelectItem>
                    <SelectItem value="verboten">Verboten</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </VfCalculatorInputGroup>
          </div>
        )}

        {currentStep === 6 && (
          <div className="space-y-4">
            <div className="p-6 bg-[var(--theme-surface)] rounded-lg">
              <h3 className="font-semibold mb-4">Vertragszusammenfassung</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Mieter:</span>
                  <span className="font-medium">{formData.tenant_first_name} {formData.tenant_last_name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Vertragsbeginn:</span>
                  <span className="font-medium">{formData.contract_start}</span>
                </div>
                <div className="flex justify-between">
                  <span>Warmmiete:</span>
                  <span className="font-medium">{totalRent.toLocaleString('de-DE')} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Kaution:</span>
                  <span className="font-medium">{(formData.deposit_months * formData.base_rent).toLocaleString('de-DE')} €</span>
                </div>
                <div className="flex justify-between">
                  <span>Indexmiete:</span>
                  <span className="font-medium">{formData.indexmiete_enabled ? 'Ja' : 'Nein'}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </VfWizard>
    </div>
  );
}