import React, { useState } from 'react';
import { VfOnboardingWizard, VfOnboardingOptions } from '@/components/onboarding/VfOnboardingWizard';
import { base44 } from '@/api/base44Client';
import { useMutation } from '@tanstack/react-query';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Home, Building, Users, TrendingUp, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function OnboardingWizardNew() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    userType: '',
    goals: [],
    buildingName: '',
    buildingAddress: ''
  });

  const createBuildingMutation = useMutation({
    mutationFn: (data) => base44.entities.Building.create(data),
    onSuccess: () => {
      navigate(createPageUrl('Dashboard'));
    }
  });

  const steps = [
    { 
      id: 'welcome', 
      title: 'Willkommen bei vermitify!', 
      description: 'Ihre Immobilien verwalten sich von selbst. Die Steuern auch.' 
    },
    { 
      id: 'profile', 
      title: 'Wer sind Sie?', 
      description: 'Damit wir Ihnen die besten Funktionen zeigen können' 
    },
    { 
      id: 'goals', 
      title: 'Was möchten Sie erreichen?', 
      description: 'Wählen Sie Ihre wichtigsten Ziele' 
    },
    { 
      id: 'first-building', 
      title: 'Ihr erstes Objekt', 
      description: 'Legen Sie Ihr erstes Objekt an' 
    },
    { 
      id: 'done', 
      title: 'Fertig!', 
      description: 'Los geht\'s mit vermitify' 
    }
  ];

  const userTypes = [
    { 
      id: 'private', 
      label: 'Privater Vermieter', 
      description: '1-5 Objekte, Selbstverwaltung', 
      icon: Home 
    },
    { 
      id: 'professional', 
      label: 'Professioneller Vermieter', 
      description: '6+ Objekte, strukturiert', 
      icon: Building 
    },
    { 
      id: 'manager', 
      label: 'Hausverwaltung', 
      description: 'Verwaltung für Dritte', 
      icon: Users 
    },
    { 
      id: 'investor', 
      label: 'Investor', 
      description: 'Fokus auf Rendite & Analyse', 
      icon: TrendingUp 
    }
  ];

  const handleComplete = async () => {
    if (formData.buildingName) {
      await createBuildingMutation.mutateAsync({
        name: formData.buildingName,
        address: formData.buildingAddress,
        building_type: 'Wohngebäude'
      });
    } else {
      navigate(createPageUrl('Dashboard'));
    }
  };

  return (
    <VfOnboardingWizard
      steps={steps}
      currentStep={currentStep}
      onStepChange={setCurrentStep}
      onComplete={handleComplete}
    >
      {currentStep === 0 && (
        <div className="text-center">
          <p className="text-lg text-[var(--theme-text-secondary)] mb-4">
            In nur 5 Minuten richten wir gemeinsam Ihr erstes Objekt ein.
          </p>
        </div>
      )}

      {currentStep === 1 && (
        <VfOnboardingOptions
          options={userTypes}
          value={formData.userType}
          onChange={(value) => setFormData({ ...formData, userType: value })}
        />
      )}

      {currentStep === 2 && (
        <div className="text-left space-y-3">
          {['Übersicht über alle Objekte', 'Finanzen im Griff', 'Steuern optimieren', 'Zeit sparen'].map((goal, i) => (
            <label key={i} className="flex items-center gap-3 p-3 border border-[var(--theme-border)] rounded-lg cursor-pointer hover:bg-[var(--theme-surface-hover)]">
              <input type="checkbox" className="vf-checkbox" />
              <span>{goal}</span>
            </label>
          ))}
        </div>
      )}

      {currentStep === 3 && (
        <div className="text-left space-y-4">
          <div>
            <Label required>Objektname</Label>
            <Input
              value={formData.buildingName}
              onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
              placeholder="z.B. Hauptstraße 1"
            />
          </div>
          <div>
            <Label>Adresse</Label>
            <Input
              value={formData.buildingAddress}
              onChange={(e) => setFormData({ ...formData, buildingAddress: e.target.value })}
              placeholder="Musterstraße 42, 12345 Musterstadt"
            />
          </div>
          <p className="text-sm text-[var(--theme-text-muted)]">
            Sie können später weitere Details hinzufügen
          </p>
        </div>
      )}

      {currentStep === 4 && (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 mx-auto mb-4 text-[var(--vf-success-500)]" />
          <h3 className="text-xl font-semibold mb-2">Alles bereit!</h3>
          <p className="text-[var(--theme-text-secondary)]">
            Sie können jetzt mit vermitify durchstarten.
          </p>
        </div>
      )}
    </VfOnboardingWizard>
  );
}