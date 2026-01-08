import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { base44 } from '@/api/base44Client';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Sparkles, ChevronRight, ChevronLeft, CheckCircle, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxFormWizard({ onComplete }) {
  const [step, setStep] = useState(1);
  const [formType, setFormType] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [taxYear, setTaxYear] = useState(new Date().getFullYear() - 1);
  const [submissionId, setSubmissionId] = useState(null);
  const [formData, setFormData] = useState(null);
  const [validationResult, setValidationResult] = useState(null);

  const { data: buildings = [] } = useQuery({
    queryKey: ['buildings'],
    queryFn: () => base44.entities.Building.list()
  });

  const generateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('generateTaxFormWithAI', data),
    onSuccess: (response) => {
      setSubmissionId(response.data.submission_id);
      setFormData(response.data.form_data);
      toast.success('Formular generiert!');
      setStep(3);
    }
  });

  const validateMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('validateFormPlausibility', data),
    onSuccess: (response) => {
      setValidationResult(response.data.validation);
      setStep(4);
    }
  });

  const generateXMLMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('generateElsterXML', data),
    onSuccess: () => {
      toast.success('XML generiert!');
      setStep(5);
    }
  });

  const submitMutation = useMutation({
    mutationFn: (data) => base44.functions.invoke('submitToElster', data),
    onSuccess: (response) => {
      toast.success(response.data.message);
      onComplete?.();
    }
  });

  const totalSteps = 5;
  const progress = (step / totalSteps) * 100;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <Progress value={progress} className="h-2" />
        <div className="flex justify-between mt-2 text-sm text-slate-600">
          <span>Schritt {step} von {totalSteps}</span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {step === 1 && (
          <StepCard key="step1" title="Formular auswählen">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Formular-Typ</label>
                <Select value={formType} onValueChange={setFormType}>
                  <SelectTrigger>
                    <SelectValue placeholder="Typ wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ANLAGE_V">Anlage V - Vermietung & Verpachtung</SelectItem>
                    <SelectItem value="EUER">EÜR - Einnahmen-Überschuss</SelectItem>
                    <SelectItem value="EST1B">ESt 1B - Personengesellschaften</SelectItem>
                    <SelectItem value="GEWERBESTEUER">Gewerbesteuererklärung</SelectItem>
                    <SelectItem value="UMSATZSTEUER">Umsatzsteuererklärung</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Objekt</label>
                <Select value={buildingId} onValueChange={setBuildingId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Objekt wählen..." />
                  </SelectTrigger>
                  <SelectContent>
                    {buildings.map(b => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.address || b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Steuerjahr</label>
                <Select value={String(taxYear)} onValueChange={(v) => setTaxYear(parseInt(v))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[0, 1, 2, 3, 4].map(i => {
                      const year = new Date().getFullYear() - 1 - i;
                      return <SelectItem key={year} value={String(year)}>{year}</SelectItem>;
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </StepCard>
        )}

        {step === 2 && (
          <StepCard key="step2" title="KI-Vorbefüllung" icon={Sparkles}>
            <Alert className="mb-4">
              <Sparkles className="h-4 w-4" />
              <AlertDescription>
                Die KI analysiert Ihre Daten und füllt das Formular automatisch vor.
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => generateMutation.mutate({ building_id: buildingId, form_type: formType, tax_year: taxYear })}
              disabled={generateMutation.isPending}
              className="w-full bg-emerald-600 hover:bg-emerald-700"
            >
              {generateMutation.isPending ? 'Wird generiert...' : 'Jetzt generieren'}
            </Button>
          </StepCard>
        )}

        {step === 3 && formData && (
          <StepCard key="step3" title="Prüfung & Anpassung">
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(formData).map(([key, value]) => (
                <div key={key} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                  <span className="text-sm font-medium">{key}</span>
                  <span className="text-sm text-slate-600">{String(value)}</span>
                </div>
              ))}
            </div>
          </StepCard>
        )}

        {step === 4 && validationResult && (
          <StepCard key="step4" title="Validierung">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className={`text-2xl font-bold ${validationResult.plausibility_score >= 80 ? 'text-green-600' : 'text-yellow-600'}`}>
                  {validationResult.plausibility_score}%
                </div>
                <span className="text-slate-600">Plausibilitäts-Score</span>
              </div>

              {validationResult.anomalies?.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Auffälligkeiten:</h4>
                  {validationResult.anomalies.map((anomaly, idx) => (
                    <Alert key={idx} variant={anomaly.severity === 'HIGH' ? 'destructive' : 'default'} className="mb-2">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>{anomaly.description}</AlertDescription>
                    </Alert>
                  ))}
                </div>
              )}
            </div>
          </StepCard>
        )}

        {step === 5 && (
          <StepCard key="step5" title="Übermittlung">
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Formular ist bereit zur Übermittlung
                </AlertDescription>
              </Alert>

              <div className="flex gap-3">
                <Button
                  onClick={() => submitMutation.mutate({ submission_id: submissionId })}
                  disabled={submitMutation.isPending}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                >
                  {submitMutation.isPending ? 'Wird übermittelt...' : 'An ELSTER senden'}
                </Button>
              </div>
            </div>
          </StepCard>
        )}
      </AnimatePresence>

      <div className="flex justify-between mt-6">
        <Button
          variant="outline"
          onClick={() => setStep(Math.max(1, step - 1))}
          disabled={step === 1}
        >
          <ChevronLeft className="w-4 h-4 mr-2" />
          Zurück
        </Button>

        {step < 5 && step !== 2 && (
          <Button
            onClick={() => {
              if (step === 1) setStep(2);
              else if (step === 3) {
                validateMutation.mutate({ form_data: formData, form_type: formType, legal_form: 'PRIVATPERSON' });
              } else if (step === 4) {
                generateXMLMutation.mutate({ submission_id: submissionId });
              }
            }}
            disabled={!formType || !buildingId}
          >
            Weiter
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        )}
      </div>
    </div>
  );
}

function StepCard({ title, icon: Icon, children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {Icon && <Icon className="w-5 h-5" />}
            {title}
          </CardTitle>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </motion.div>
  );
}