import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const STEPS = [
  {
    title: 'Kontaktdaten',
    description: 'Fügen Sie Ihre Kontaktinformationen hinzu',
    fields: ['primary_contact_phone', 'emergency_contact']
  },
  {
    title: 'Kommunikationseinstellungen',
    description: 'Bevorzugte Kommunikationsmethoden',
    fields: ['notification_method', 'preferred_contact_time']
  }
];

export default function OnboardingSetupWizard({ tenantData, onComplete, isLoading }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({
    primary_contact_phone: tenantData?.phone || '',
    emergency_contact: '',
    notification_method: 'email',
    preferred_contact_time: 'morning'
  });

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const handleInputChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleNext = () => {
    const requiredFields = currentStep.fields;
    const allFilled = requiredFields.every(field => formData[field]);

    if (!allFilled) {
      toast.error('Bitte füllen Sie alle erforderlichen Felder aus');
      return;
    }

    if (isLastStep) {
      onComplete(formData);
    } else {
      setCurrentStepIndex(currentStepIndex + 1);
    }
  };

  const handleBack = () => {
    if (!isFirstStep) {
      setCurrentStepIndex(currentStepIndex - 1);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{currentStep.title}</CardTitle>
          <p className="text-sm text-slate-600 mt-1">{currentStep.description}</p>
        </div>
        <div className="mt-4">
          <div className="flex justify-between text-xs text-slate-600 mb-2">
            <span>Schritt {currentStepIndex + 1} von {STEPS.length}</span>
            <span>{Math.round(((currentStepIndex + 1) / STEPS.length) * 100)}%</span>
          </div>
          <div className="h-1 bg-slate-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-slate-700 transition-all duration-300"
              style={{ width: `${((currentStepIndex + 1) / STEPS.length) * 100}%` }}
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Step 1: Contact Info */}
        {currentStepIndex === 0 && (
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="Primäre Kontaktnummer"
              value={formData.primary_contact_phone}
              onChange={(e) => handleInputChange('primary_contact_phone', e.target.value)}
            />
            <Input
              placeholder="Notfallkontakt (Name & Nummer)"
              value={formData.emergency_contact}
              onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
            />
          </div>
        )}

        {/* Step 2: Preferences */}
        {currentStepIndex === 1 && (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-slate-900 mb-2 block">Bevorzugte Kommunikationsmethode</label>
              <Select value={formData.notification_method} onValueChange={(val) => handleInputChange('notification_method', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="sms">SMS</SelectItem>
                  <SelectItem value="both">Email & SMS</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-900 mb-2 block">Bevorzugte Kontaktzeit</label>
              <Select value={formData.preferred_contact_time} onValueChange={(val) => handleInputChange('preferred_contact_time', val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Morgens (08:00-12:00)</SelectItem>
                  <SelectItem value="afternoon">Nachmittags (12:00-18:00)</SelectItem>
                  <SelectItem value="evening">Abends (18:00-22:00)</SelectItem>
                  <SelectItem value="flexible">Flexibel</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex gap-2 justify-between pt-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={handleBack}
            disabled={isFirstStep}
          >
            Zurück
          </Button>
          <Button
            onClick={handleNext}
            disabled={isLoading}
            className="bg-slate-700 hover:bg-slate-800 gap-2"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Wird verarbeitet...
              </>
            ) : (
              <>
                {isLastStep ? 'Fertigstellen' : 'Weiter'}
                {!isLastStep && <ArrowRight className="w-4 h-4" />}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}