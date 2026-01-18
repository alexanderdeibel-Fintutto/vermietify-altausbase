import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { VfSelect } from '@/components/shared/VfSelect';
import { VfDatePicker } from '@/components/shared/VfDatePicker';
import { VfInput } from '@/components/shared/VfInput';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';

export default function BKAbrechnungWizardEnhanced() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState({
    building_id: '',
    period_from: '',
    period_to: '',
    costs: []
  });

  const steps = [
    { id: 'building', title: 'Objekt' },
    { id: 'period', title: 'Zeitraum' },
    { id: 'costs', title: 'Kosten' },
    { id: 'distribution', title: 'Verteilung' },
    { id: 'calculate', title: 'Berechnung' },
    { id: 'preview', title: 'Vorschau' },
    { id: 'send', title: 'Versand' }
  ];

  const costCategories = [
    { id: 'grundsteuer', label: 'Grundsteuer', betrKV: '§2 Nr. 1' },
    { id: 'wasser', label: 'Wasserversorgung', betrKV: '§2 Nr. 2' },
    { id: 'muellabfuhr', label: 'Müllabfuhr', betrKV: '§2 Nr. 8' },
    { id: 'hausreinigung', label: 'Hausreinigung', betrKV: '§2 Nr. 9' },
    { id: 'versicherung', label: 'Versicherungen', betrKV: '§2 Nr. 13' }
  ];

  return (
    <div className="min-h-screen bg-[var(--theme-background)] p-6">
      <div className="vf-wizard">
        <div className="vf-wizard__header">
          <div className="flex justify-between items-center">
            <h1 className="vf-wizard__title">Betriebskostenabrechnung erstellen</h1>
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
          {step === 2 && (
            <div>
              <h2 className="text-xl font-semibold mb-6">Kosten erfassen</h2>
              <table className="vf-cost-table">
                <thead>
                  <tr>
                    <th>Kostenkategorie</th>
                    <th>Betrag</th>
                    <th>Schlüssel</th>
                    <th>Beleg</th>
                  </tr>
                </thead>
                <tbody>
                  {costCategories.map((cat) => (
                    <tr key={cat.id}>
                      <td className="vf-cost-table__category">
                        <input type="checkbox" className="mr-2" />
                        {cat.label}
                        <span className="text-xs text-[var(--theme-text-muted)] ml-2">{cat.betrKV}</span>
                      </td>
                      <td className="vf-cost-table__amount">
                        <VfInput type="number" rightAddon="€" />
                      </td>
                      <td>
                        <VfSelect
                          options={[
                            { value: 'flaeche', label: 'Fläche' },
                            { value: 'personen', label: 'Personen' },
                            { value: 'einheiten', label: 'Einheiten' }
                          ]}
                        />
                      </td>
                      <td className="vf-cost-table__belege">
                        <Button variant="outline" size="sm">+ Beleg</Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div className="mt-6 p-4 bg-[var(--theme-surface)] rounded-lg">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Gesamtkosten:</span>
                  <CurrencyDisplay amount={7740} />
                </div>
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
            Weiter
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </div>
      </div>
    </div>
  );
}