import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Wand2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function TaxDeclarationWizard() {
  const [step, setStep] = useState(1);

  const submitMutation = useMutation({
    mutationFn: async () => {
      const response = await base44.functions.invoke('generateTaxDeclaration', {});
      return response.data;
    },
    onSuccess: () => {
      toast.success('Steuererklärung erstellt');
      setStep(1);
    }
  });

  const steps = [
    { title: 'Persönliche Daten', component: 'PersonalInfo' },
    { title: 'Einkünfte', component: 'Income' },
    { title: 'Werbungskosten', component: 'Deductions' },
    { title: 'Zusammenfassung', component: 'Summary' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wand2 className="w-5 h-5" />
          Steuererklärungs-Assistent
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Progress value={(step / steps.length) * 100} />
        <p className="text-sm font-semibold">Schritt {step} von {steps.length}</p>
        <p className="text-sm text-slate-600">{steps[step - 1].title}</p>
        
        <div className="flex gap-2">
          {step > 1 && (
            <Button variant="outline" onClick={() => setStep(step - 1)}>
              Zurück
            </Button>
          )}
          <Button onClick={() => step < steps.length ? setStep(step + 1) : submitMutation.mutate()} className="flex-1">
            {step < steps.length ? 'Weiter' : 'Absenden'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}