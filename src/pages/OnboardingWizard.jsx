import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { toast } from 'sonner';

// Import step components
import OnboardingStep1Profile from '@/components/onboarding/OnboardingStep1Profile';
import OnboardingStep2Countries from '@/components/onboarding/OnboardingStep2Countries';
import OnboardingStep3IncomeSource from '@/components/onboarding/OnboardingStep3IncomeSource';
import OnboardingStep4TutorialFeatures from '@/components/onboarding/OnboardingStep4TutorialFeatures';
import OnboardingStep5TaxAuthority from '@/components/onboarding/OnboardingStep5TaxAuthority';
import OnboardingStep6Complete from '@/components/onboarding/OnboardingStep6Complete';

const steps = [
  { id: 1, title: 'Steuerprofil', description: 'Grundlegende Informationen' },
  { id: 2, title: 'Länder', description: 'Steuerjurisdiktionen' },
  { id: 3, title: 'Einkommen', description: 'Einkommensarten' },
  { id: 4, title: 'Funktionen', description: 'Funktionen-Tour' },
  { id: 5, title: 'Behörden', description: 'Tax Authority Verbindung' },
  { id: 6, title: 'Fertig', description: 'Zusammenfassung' }
];

export default function OnboardingWizard() {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    profile_type: 'simple',
    primary_country: 'DE',
    tax_jurisdictions: [],
    income_sources: [],
    countries_completed: false,
    tutorial_completed: false,
    tax_authority_connected: false
  });
  const navigate = useNavigate();

  const handleNext = async () => {
    // Validation for current step
    if (currentStep === 1 && !formData.profile_type) {
      toast.error('Bitte wählen Sie einen Profiltyp');
      return;
    }
    if (currentStep === 2 && formData.tax_jurisdictions.length === 0) {
      toast.error('Bitte wählen Sie mindestens ein Land');
      return;
    }
    if (currentStep === 3 && formData.income_sources.length === 0) {
      toast.error('Bitte wählen Sie mindestens eine Einkommensart');
      return;
    }

    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    try {
      setLoading(true);

      // Create or update tax profile
      const user = await base44.auth.me();
      const profiles = await base44.entities.TaxProfile.filter(
        { user_email: user.email },
        '-updated_date',
        1
      );

      if (profiles.length > 0) {
        // Update existing
        await base44.entities.TaxProfile.update(profiles[0].id, {
          profile_type: formData.profile_type,
          primary_residence_country: formData.primary_country,
          tax_jurisdictions: formData.tax_jurisdictions,
          income_sources: formData.income_sources
        });
      } else {
        // Create new
        await base44.entities.TaxProfile.create({
          user_email: user.email,
          profile_type: formData.profile_type,
          primary_residence_country: formData.primary_country,
          tax_jurisdictions: formData.tax_jurisdictions,
          income_sources: formData.income_sources
        });
      }

      // Mark onboarding as complete
      await base44.auth.updateMe({
        onboarding_completed: true,
        onboarding_completed_at: new Date().toISOString()
      });

      toast.success('Onboarding abgeschlossen!');
      navigate('/dashboard');
    } catch (error) {
      toast.error(`Fehler: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const progressPercent = (currentStep / steps.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-light mb-2">Willkommen bei FinX</h1>
          <p className="text-slate-600">Lassen Sie uns Ihre Steuersituation einrichten</p>
        </div>

        {/* Progress Bar */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`flex flex-col items-center ${
                    currentStep >= step.id ? 'opacity-100' : 'opacity-50'
                  }`}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium mb-1 ${
                      currentStep === step.id
                        ? 'bg-blue-600 text-white'
                        : currentStep > step.id
                        ? 'bg-green-600 text-white'
                        : 'bg-slate-300 text-slate-600'
                    }`}
                  >
                    {step.id}
                  </div>
                  <p className="text-xs font-medium text-center max-w-12">{step.title}</p>
                </div>
              ))}
            </div>
            <Progress value={progressPercent} className="h-2" />
          </CardContent>
        </Card>

        {/* Step Content */}
        <Card className="mb-6 min-h-96">
          <CardHeader>
            <CardTitle className="text-2xl">
              {steps[currentStep - 1].title}: {steps[currentStep - 1].description}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {currentStep === 1 && (
              <OnboardingStep1Profile
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 2 && (
              <OnboardingStep2Countries
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 3 && (
              <OnboardingStep3IncomeSource
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 4 && (
              <OnboardingStep4TutorialFeatures
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 5 && (
              <OnboardingStep5TaxAuthority
                formData={formData}
                setFormData={setFormData}
              />
            )}
            {currentStep === 6 && (
              <OnboardingStep6Complete formData={formData} />
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between gap-4">
          <Button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            variant="outline"
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-2" />
            Zurück
          </Button>
          <Button
            onClick={handleNext}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700"
          >
            {currentStep === steps.length ? 'Fertigstellen' : 'Weiter'}
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        {/* Skip option */}
        <Button
          onClick={() => navigate('/dashboard')}
          variant="ghost"
          className="w-full mt-4 text-slate-600"
        >
          Onboarding überspringen
        </Button>
      </div>
    </div>
  );
}