import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useMutation } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import CryptoForm from './scenarios/CryptoForm';
import GmbhForm from './scenarios/GmbhForm';
import MultiCountryForm from './scenarios/MultiCountryForm';
import BankIntegrationForm from './scenarios/BankIntegrationForm';

export default function ScenarioSpecificForm({ scenario, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({});

  const steps = scenario?.workflow_steps || [];

  const submitStep = useMutation({
    mutationFn: async (data) => {
      // Save step data
      const merged = { ...formData, ...data };
      setFormData(merged);

      if (currentStep < steps.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        onComplete(merged);
      }
    }
  });

  const getFormComponent = () => {
    const step = steps[currentStep];
    if (!step) return null;

    const componentMap = {
      'crypto_form': CryptoForm,
      'gmbh_form': GmbhForm,
      'multi_country': MultiCountryForm,
      'bank_integration': BankIntegrationForm
    };

    const Component = componentMap[step.component_type];
    return Component ? (
      <Component
        onSubmit={(data) => submitStep.mutate(data)}
        isLoading={submitStep.isPending}
      />
    ) : null;
  };

  const step = steps[currentStep];

  return (
    <div className="space-y-4 max-w-2xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between text-xs font-light text-slate-600 mb-4">
        <span>Schritt {currentStep + 1} von {steps.length}</span>
        <div className="flex gap-1">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-1 rounded-full ${
                idx <= currentStep ? 'bg-slate-900 w-6' : 'bg-slate-200 w-3'
              } transition-all`}
            />
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">
            {step?.step_name}
          </CardTitle>
          <p className="text-xs font-light text-slate-600 mt-2">
            {step?.description}
          </p>
        </CardHeader>
        <CardContent>
          {getFormComponent()}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex gap-3 justify-between">
        <Button
          variant="outline"
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0 || submitStep.isPending}
        >
          Zurück
        </Button>
        {currentStep < steps.length - 1 && (
          <Button
            variant="ghost"
            onClick={() => onComplete(formData)}
            className="text-xs"
          >
            Überspringen
          </Button>
        )}
      </div>
    </div>
  );
}