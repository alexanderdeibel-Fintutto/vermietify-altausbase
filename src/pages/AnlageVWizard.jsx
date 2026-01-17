import React, { useState } from 'react';
import { VfWizard } from '@/components/workflows/VfWizard';
import { VfCalculatorInputGroup } from '@/components/calculators/VfCalculatorInputGroup';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery, useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export default function AnlageVWizard() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    tax_year: new Date().getFullYear() - 1,
    building_ids: [],
    total_rentals: 0,
    total_expenses: 0
  });

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const createMutation = useMutation({
    mutationFn: (data) => base44.entities.AnlageV.create(data)
  });

  const steps = [
    { id: 'year', label: 'Steuerjahr', title: 'Steuerjahr auswählen' },
    { id: 'buildings', label: 'Objekte', title: 'Objekte auswählen' },
    { id: 'income', label: 'Einnahmen', title: 'Mieteinnahmen' },
    { id: 'expenses', label: 'Ausgaben', title: 'Werbungskosten' },
    { id: 'afa', label: 'AfA', title: 'Abschreibung' },
    { id: 'summary', label: 'Zusammenfassung', title: 'Zusammenfassung' },
    { id: 'export', label: 'Export', title: 'Export' }
  ];

  const handleComplete = () => {
    createMutation.mutate({
      tax_year: formData.tax_year,
      building_id: formData.building_ids[0],
      status: 'CALCULATED',
      total_rentals: formData.total_rentals,
      total_expenses: formData.total_expenses,
      net_income: formData.total_rentals - formData.total_expenses
    });
  };

  return (
    <div className="max-w-5xl mx-auto py-8">
      <VfWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      >
        {currentStep === 0 && (
          <VfCalculatorInputGroup title="Steuerjahr">
            <Select value={String(formData.tax_year)} onValueChange={(v) => setFormData({ ...formData, tax_year: Number(v) })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={String(new Date().getFullYear() - 1)}>{new Date().getFullYear() - 1}</SelectItem>
                <SelectItem value={String(new Date().getFullYear() - 2)}>{new Date().getFullYear() - 2}</SelectItem>
                <SelectItem value={String(new Date().getFullYear() - 3)}>{new Date().getFullYear() - 3}</SelectItem>
              </SelectContent>
            </Select>
          </VfCalculatorInputGroup>
        )}

        {currentStep === 1 && (
          <VfCalculatorInputGroup title="Objekte für Anlage V">
            <div className="space-y-2">
              {buildings.map((building) => (
                <label key={building.id} className="flex items-center gap-3 p-3 border border-[var(--theme-border)] rounded-lg cursor-pointer hover:bg-[var(--theme-surface-hover)]">
                  <input type="checkbox" className="vf-checkbox" />
                  <div>
                    <div className="font-medium">{building.name}</div>
                    <div className="text-sm text-[var(--theme-text-muted)]">{building.address}</div>
                  </div>
                </label>
              ))}
            </div>
          </VfCalculatorInputGroup>
        )}

        {currentStep === 2 && (
          <VfCalculatorInputGroup title="Mieteinnahmen">
            <div>
              <Label>Gesamte Mieteinnahmen {formData.tax_year}</Label>
              <Input
                type="number"
                value={formData.total_rentals}
                onChange={(e) => setFormData({ ...formData, total_rentals: Number(e.target.value) })}
                placeholder="14400"
              />
              <p className="text-xs text-[var(--theme-text-muted)] mt-1">
                Wird automatisch aus Verträgen berechnet
              </p>
            </div>
          </VfCalculatorInputGroup>
        )}

        {currentStep === 3 && (
          <VfCalculatorInputGroup title="Werbungskosten">
            <div>
              <Label>Gesamte Werbungskosten {formData.tax_year}</Label>
              <Input
                type="number"
                value={formData.total_expenses}
                onChange={(e) => setFormData({ ...formData, total_expenses: Number(e.target.value) })}
                placeholder="8500"
              />
              <p className="text-xs text-[var(--theme-text-muted)] mt-1">
                Instandhaltung, Zinsen, Versicherungen, etc.
              </p>
            </div>
          </VfCalculatorInputGroup>
        )}

        {currentStep === 5 && (
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold text-lg mb-4">Anlage V - Zusammenfassung</h3>
              <div className="space-y-3">
                <div className="flex justify-between py-2 border-b border-[var(--theme-divider)]">
                  <span>Steuerjahr:</span>
                  <span className="font-semibold">{formData.tax_year}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--theme-divider)]">
                  <span>Mieteinnahmen:</span>
                  <span className="font-semibold text-[var(--vf-success-600)]">+{formData.total_rentals.toLocaleString('de-DE')} €</span>
                </div>
                <div className="flex justify-between py-2 border-b border-[var(--theme-divider)]">
                  <span>Werbungskosten:</span>
                  <span className="font-semibold text-[var(--vf-error-600)]">-{formData.total_expenses.toLocaleString('de-DE')} €</span>
                </div>
                <div className="flex justify-between py-3 border-t-2 border-[var(--theme-border)] font-bold text-lg">
                  <span>Einkünfte aus V+V:</span>
                  <span>{(formData.total_rentals - formData.total_expenses).toLocaleString('de-DE')} €</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {currentStep === 6 && (
          <div className="text-center space-y-4">
            <div className="text-6xl mb-4">✅</div>
            <h3 className="text-xl font-semibold">Anlage V erstellt!</h3>
            <p className="text-[var(--theme-text-secondary)]">
              Die Anlage V wurde erfolgreich berechnet.
            </p>
            <div className="flex gap-3 justify-center mt-6">
              <Button variant="outline">ELSTER-Export</Button>
              <Button variant="gradient">PDF herunterladen</Button>
            </div>
          </div>
        )}
      </VfWizard>
    </div>
  );
}