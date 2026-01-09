import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronRight, CheckCircle2, AlertTriangle } from 'lucide-react';

const CURRENT_YEAR = new Date().getFullYear();

const FILING_STEPS = {
  AT: [
    { id: 'personal', title: 'Persönliche Daten', icon: '👤', items: ['Name', 'Steuer-ID', 'Wohnort'] },
    { id: 'income', title: 'Einkünfte', icon: '💰', items: ['Kapitalerträge (Anlage KAP)', 'Sonstige Einkünfte (Anlage SO)', 'Mieteinnahmen (Anlage V)'] },
    { id: 'deductions', title: 'Abzüge', icon: '📉', items: ['Werbungskosten', 'Sonderausgaben', 'Außergewöhnliche Belastungen'] },
    { id: 'summary', title: 'Zusammenfassung', icon: '✅', items: ['Überblick', 'Prüfung', 'Absendung'] }
  ],
  CH: [
    { id: 'personal', title: 'Persönliche Daten', icon: '👤', items: ['Name', 'AHV-Nummer', 'Kanton', 'Gemeinde'] },
    { id: 'income', title: 'Einkünfte', icon: '💰', items: ['Lohneinkommen', 'Kapitalerträge', 'Mieteinnahmen'] },
    { id: 'wealth', title: 'Vermögen', icon: '💼', items: ['Wertschriften', 'Immobilien', 'Schulden'] },
    { id: 'deductions', title: 'Abzüge', icon: '📉', items: ['Hypothekarzinsen', 'Versicherungen', 'Berufsausgaben'] },
    { id: 'summary', title: 'Zusammenfassung', icon: '✅', items: ['Kontrolle', 'Submission'] }
  ],
  DE: [
    { id: 'personal', title: 'Persönliche Daten', icon: '👤', items: ['Name', 'Steuernummer', 'Wohnort'] },
    { id: 'income', title: 'Einkommen', icon: '💰', items: ['Einkünfte aus Kapitalvermögen', 'Einkünfte aus Vermietung', 'Sonstige Einkünfte'] },
    { id: 'deductions', title: 'Kosten', icon: '📉', items: ['Werbungskosten', 'Sonderausgaben', 'Außergewöhnliche Belastungen'] },
    { id: 'tax', title: 'Berechnung', icon: '🧮', items: ['Einkommensteuer', 'Solidaritätszuschlag', 'Kirchensteuer'] },
    { id: 'summary', title: 'Abschluss', icon: '✅', items: ['Überblick', 'Validierung', 'ELSTER'] }
  ]
};

export default function TaxFilingWizard() {
  const [country, setCountry] = useState('DE');
  const [taxYear, setTaxYear] = useState(CURRENT_YEAR - 1);
  const [filingType, setFilingType] = useState('individual');
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());

  const queryClient = useQueryClient();
  const steps = FILING_STEPS[country] || [];
  const progressPercent = (completedSteps.size / steps.length) * 100;

  const createFilingMutation = useMutation({
    mutationFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.TaxFiling.create({
        user_email: user.email,
        country,
        tax_year: taxYear,
        filing_type: filingType,
        status: 'prepared',
        completion_percentage: progressPercent,
        filing_data: {
          created_at: new Date().toISOString(),
          steps_completed: Array.from(completedSteps)
        }
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['taxFilings'] });
    }
  });

  const handleStepComplete = (stepId) => {
    const newCompleted = new Set(completedSteps);
    if (newCompleted.has(stepId)) {
      newCompleted.delete(stepId);
    } else {
      newCompleted.add(stepId);
    }
    setCompletedSteps(newCompleted);
  };

  const handleSubmit = async () => {
    await createFilingMutation.mutateAsync();
  };

  const currentStepData = steps[currentStep];
  const isStepComplete = completedSteps.has(currentStepData?.id);
  const isLastStep = currentStep === steps.length - 1;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">📋 Steuererklärung Wizard</h1>
        <p className="text-slate-500 mt-1">Schritt-für-Schritt durch Ihre Steuererklärung</p>
      </div>

      {/* Country & Year Selection */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium">Land</label>
              <Select value={country} onValueChange={(c) => { setCountry(c); setCurrentStep(0); setCompletedSteps(new Set()); }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="AT">🇦🇹 Österreich</SelectItem>
                  <SelectItem value="CH">🇨🇭 Schweiz</SelectItem>
                  <SelectItem value="DE">🇩🇪 Deutschland</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Steuerjahr</label>
              <Select value={taxYear.toString()} onValueChange={(y) => setTaxYear(parseInt(y))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[CURRENT_YEAR - 2, CURRENT_YEAR - 1, CURRENT_YEAR].map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium">Veranlagungsart</label>
              <Select value={filingType} onValueChange={setFilingType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="individual">Einzelveranlagung</SelectItem>
                  <SelectItem value="joint">Zusammenveranlagung</SelectItem>
                  <SelectItem value="business">Geschäftsbetrieb</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <p className="font-semibold">Fortschritt</p>
            <span className="text-sm text-slate-600">{Math.round(progressPercent)}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </CardContent>
      </Card>

      {/* Steps Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {steps.map((step, idx) => (
          <button
            key={step.id}
            onClick={() => setCurrentStep(idx)}
            className={`p-3 rounded-lg border-2 transition-all text-left ${
              currentStep === idx 
                ? 'border-blue-500 bg-blue-50' 
                : completedSteps.has(step.id)
                ? 'border-green-300 bg-green-50'
                : 'border-slate-200 hover:border-slate-300'
            }`}
          >
            <p className="text-lg mb-1">{step.icon}</p>
            <p className="text-xs font-semibold truncate">{step.title}</p>
            {completedSteps.has(step.id) && (
              <CheckCircle2 className="w-3 h-3 text-green-600 mt-1" />
            )}
          </button>
        ))}
      </div>

      {/* Current Step Content */}
      {currentStepData && (
        <Card className="border-blue-300 bg-blue-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span className="text-2xl">{currentStepData.icon}</span>
              {currentStepData.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-600">Schritt {currentStep + 1} von {steps.length}</p>

            {/* Checklist */}
            <div className="space-y-2 bg-white p-4 rounded-lg">
              {currentStepData.items.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <Checkbox id={`item-${idx}`} defaultChecked={false} />
                  <label htmlFor={`item-${idx}`} className="text-sm cursor-pointer">
                    {item}
                  </label>
                </div>
              ))}
            </div>

            {/* Help Text */}
            <Alert>
              <AlertDescription className="text-sm">
                💡 <strong>{currentStepData.title}:</strong> Füllen Sie alle erforderlichen Informationen für diesen Schritt aus.
              </AlertDescription>
            </Alert>

            {/* Step Complete Checkbox */}
            <div className="flex items-center gap-3 pt-4 border-t">
              <Checkbox
                id="complete-step"
                checked={isStepComplete}
                onCheckedChange={() => handleStepComplete(currentStepData.id)}
              />
              <label htmlFor="complete-step" className="text-sm font-medium cursor-pointer">
                Dieser Schritt ist abgeschlossen
              </label>
            </div>

            {/* Navigation */}
            <div className="flex gap-2 pt-6 border-t">
              <Button
                onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
                variant="outline"
                disabled={currentStep === 0}
              >
                ← Zurück
              </Button>

              {isLastStep ? (
                <Button
                  onClick={handleSubmit}
                  className="flex-1 bg-green-600 hover:bg-green-700 gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" /> Steuererklärung erstellen
                </Button>
              ) : (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  className="flex-1 gap-2"
                >
                  Weiter <ChevronRight className="w-4 h-4" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Footer Tip */}
      <Alert className="bg-blue-50 border-blue-200">
        <AlertDescription className="text-sm">
          ℹ️ Sie können jederzeit zwischen Schritten wechseln. Ihr Fortschritt wird automatisch gespeichert.
        </AlertDescription>
      </Alert>
    </div>
  );
}