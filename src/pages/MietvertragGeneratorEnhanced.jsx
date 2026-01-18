import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfInput } from '@/components/shared/VfInput';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { VfCheckbox } from '@/components/shared/VfCheckbox';
import { ArrowLeft, ArrowRight, X, FileText } from 'lucide-react';

export default function MietvertragGeneratorEnhanced() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    unit_id: '',
    tenant_name: '',
    begin_date: '',
    rent_cold: '',
    utilities: '',
    deposit: '',
    index_clause: false,
    pet_clause: 'zustimmung'
  });

  const steps = [
    { id: 'unit', title: 'Wohnung' },
    { id: 'tenant', title: 'Mieter' },
    { id: 'dates', title: 'Termine' },
    { id: 'rent', title: 'Miete' },
    { id: 'deposit', title: 'Kaution' },
    { id: 'clauses', title: 'Klauseln' },
    { id: 'preview', title: 'Vorschau' }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-background)] p-6">
      <div className="vf-wizard max-w-3xl">
        <div className="vf-wizard__header">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <FileText className="h-6 w-6" />
              <h1 className="vf-wizard__title">Mietvertrag erstellen</h1>
            </div>
            <Button variant="ghost" size="icon">
              <X className="h-5 w-5" />
            </Button>
          </div>
        </div>

        <div className="vf-wizard__progress">
          {steps.map((s, index) => (
            <React.Fragment key={s.id}>
              <div className="vf-wizard__step">
                <div className={`vf-wizard__step-dot ${
                  index < step ? 'vf-wizard__step-dot--completed' : 
                  index === step ? 'vf-wizard__step-dot--active' : ''
                }`} />
                <span className={`vf-wizard__step-label ${index === step ? 'vf-wizard__step-label--active' : ''}`}>
                  {s.title}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div className={`vf-wizard__step-line ${index < step ? 'vf-wizard__step-line--completed' : ''}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="vf-wizard__body">
          {step === 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Wählen Sie die Wohnung</h2>
              <VfSelect
                label="Einheit"
                placeholder="Wohnung auswählen"
                options={[
                  { value: '1', label: 'Whg. 1.OG links - 65 m²' },
                  { value: '2', label: 'Whg. 2.OG rechts - 72 m²' }
                ]}
              />
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Miete und Nebenkosten</h2>
              <div className="space-y-4">
                <VfInput
                  label="Kaltmiete"
                  type="number"
                  rightAddon="€/Monat"
                  value={data.rent_cold}
                  onChange={(e) => setData({ ...data, rent_cold: e.target.value })}
                />
                <VfInput
                  label="Nebenkosten-Vorauszahlung"
                  type="number"
                  rightAddon="€/Monat"
                  value={data.utilities}
                  onChange={(e) => setData({ ...data, utilities: e.target.value })}
                />
                <div className="p-4 bg-[var(--theme-surface)] rounded-lg">
                  <div className="flex justify-between text-lg font-semibold">
                    <span>Warmmiete gesamt:</span>
                    <span>€{(parseFloat(data.rent_cold || 0) + parseFloat(data.utilities || 0)).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 5 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Zusätzliche Vereinbarungen</h2>
              <div className="space-y-4">
                <VfCheckbox
                  label="Indexmietklausel"
                  checked={data.index_clause}
                  onChange={(checked) => setData({ ...data, index_clause: checked })}
                />
                <VfSelect
                  label="Haustiere"
                  value={data.pet_clause}
                  onChange={(v) => setData({ ...data, pet_clause: v })}
                  options={[
                    { value: 'erlaubt', label: 'Erlaubt' },
                    { value: 'kleintiere', label: 'Nur Kleintiere' },
                    { value: 'verboten', label: 'Verboten' },
                    { value: 'zustimmung', label: 'Mit Zustimmung' }
                  ]}
                />
              </div>
            </div>
          )}
        </div>

        <div className="vf-wizard__footer">
          <Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <Button variant="gradient" onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1}>
            {step === steps.length - 1 ? 'Generieren' : 'Weiter'}
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}