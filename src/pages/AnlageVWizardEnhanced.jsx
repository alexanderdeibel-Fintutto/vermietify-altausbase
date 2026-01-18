import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { VfSelect } from '@/components/shared/VfSelect';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

export default function AnlageVWizardEnhanced() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    year: 2025,
    buildings: [],
    income: {},
    expenses: {},
    afa: {}
  });

  const steps = [
    { id: 'year', title: 'Steuerjahr' },
    { id: 'buildings', title: 'Objekte' },
    { id: 'income', title: 'Einnahmen' },
    { id: 'expenses', title: 'Ausgaben' },
    { id: 'afa', title: 'AfA' },
    { id: 'summary', title: 'Zusammenfassung' },
    { id: 'export', title: 'Export' }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-background)] p-6">
      <div className="vf-wizard">
        <div className="vf-wizard__header">
          <div className="flex justify-between items-center">
            <h1 className="vf-wizard__title">Anlage V erstellen</h1>
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
              <h2 className="text-xl font-semibold mb-6">Wählen Sie das Steuerjahr</h2>
              <VfSelect
                label="Steuerjahr"
                value={data.year}
                onChange={(v) => setData({ ...data, year: v })}
                options={[
                  { value: 2026, label: '2026' },
                  { value: 2025, label: '2025' },
                  { value: 2024, label: '2024' },
                  { value: 2023, label: '2023' }
                ]}
              />
            </div>
          )}
        </div>

        <div className="vf-wizard__footer">
          <Button variant="secondary" onClick={() => setStep(Math.max(0, step - 1))} disabled={step === 0}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <Button variant="gradient" onClick={() => setStep(Math.min(steps.length - 1, step + 1))} disabled={step === steps.length - 1}>
            Weiter
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}