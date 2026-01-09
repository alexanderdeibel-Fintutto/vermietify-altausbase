import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { CheckCircle2, Loader2 } from 'lucide-react';
import OnboardingSetupWizard from '@/components/onboarding/OnboardingSetupWizard';
import OnboardingChecklist from '@/components/onboarding/OnboardingChecklist';
import PersonalizedGuide from '@/components/onboarding/PersonalizedGuide';

export default function TenantOnboarding() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState(new Set());
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me()
  });

  const { data: tenantData } = useQuery({
    queryKey: ['tenantOnboardingData', user?.email],
    queryFn: async () => {
      if (!user?.email) return null;
      const results = await base44.entities.Tenant.filter({ email: user.email }, null, 1);
      return results[0];
    },
    enabled: !!user?.email
  });

  const createOnboardingMutation = useMutation({
    mutationFn: async (data) => {
      return await base44.entities.Tenant.update(tenantData.id, {
        phone: data.primary_contact_phone,
        emergency_contact: data.emergency_contact,
        notification_method: data.notification_method,
        preferred_contact_time: data.preferred_contact_time
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenantData'] });
      setCompletedSteps(new Set([...completedSteps, 'setup']));
    }
  });

  const handleWizardComplete = (data) => {
    createOnboardingMutation.mutate(data);
  };

  const progressSteps = ['Setup Wizard', 'Checkliste', 'Guides'];
  const completionPercentage = (completedSteps.size / progressSteps.length) * 100;

  if (!tenantData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-slate-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-light text-slate-900">Willkommen zum Mieterportal</h1>
        <p className="text-slate-600 mt-1">Hallo {tenantData.full_name}! Lassen Sie uns Ihr Portal einrichten.</p>
      </div>

      {/* Progress Bar */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <p className="text-sm font-semibold text-slate-900">Onboarding Fortschritt</p>
              <span className="text-sm text-slate-600">{Math.round(completionPercentage)}%</span>
            </div>
            <Progress value={completionPercentage} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Steps */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {progressSteps.map((step, index) => (
          <Card
            key={index}
            className={`cursor-pointer transition-all ${
              completedSteps.has(step.toLowerCase().replace(/\s+/g, ''))
                ? 'bg-green-50 border-green-200'
                : ''
            }`}
            onClick={() => setCurrentStep(index)}
          >
            <CardContent className="pt-6">
              <div className="flex items-center gap-2">
                {completedSteps.has(step.toLowerCase().replace(/\s+/g, '')) ? (
                  <CheckCircle2 className="w-5 h-5 text-green-600" />
                ) : (
                  <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center text-xs font-semibold text-slate-600">
                    {index + 1}
                  </div>
                )}
                <span className="font-medium text-slate-900">{step}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content */}
      <Tabs value={`step-${currentStep}`} onValueChange={(val) => setCurrentStep(parseInt(val.split('-')[1]))}>
        <TabsList className="hidden">
          {progressSteps.map((_, idx) => (
            <TabsTrigger key={idx} value={`step-${idx}`} />
          ))}
        </TabsList>

        <TabsContent value="step-0">
          <OnboardingSetupWizard
            tenantData={tenantData}
            onComplete={handleWizardComplete}
            isLoading={createOnboardingMutation.isPending}
          />
        </TabsContent>

        <TabsContent value="step-1">
          <OnboardingChecklist
            tenantId={tenantData.id}
            onStepComplete={() => setCompletedSteps(new Set([...completedSteps, 'checklist']))}
          />
        </TabsContent>

        <TabsContent value="step-2">
          <PersonalizedGuide
            tenantData={tenantData}
            onGuideComplete={() => setCompletedSteps(new Set([...completedSteps, 'guides']))}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}