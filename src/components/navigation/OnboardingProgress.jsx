import React, { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle } from 'lucide-react';

export default function OnboardingProgress() {
  const [progress, setProgress] = useState(0);
  const [steps, setSteps] = useState([]);
  const [show, setShow] = useState(true);

  useEffect(() => {
    loadProgress();
  }, []);

  const loadProgress = async () => {
    try {
      const user = await base44.auth.me();
      const onboardingData = await base44.entities.UserOnboarding.filter({ user_id: user.id });
      
      if (onboardingData.length === 0) {
        // Create initial onboarding record
        await base44.entities.UserOnboarding.create({
          user_id: user.id,
          completed_steps: [],
          onboarding_progress: 0,
          feature_usage: {},
          data_quality_score: 0,
          days_since_signup: 0,
          user_level: 'beginner'
        });
      }

      const onboarding = onboardingData[0] || { completed_steps: [], onboarding_progress: 0 };
      
      // Check completion of steps
      const [buildings, tenants, contracts, invoices, bankAccounts] = await Promise.all([
        base44.entities.Building.list(),
        base44.entities.Tenant.list(),
        base44.entities.LeaseContract.list(),
        base44.entities.Invoice.list(),
        base44.entities.BankAccount.list()
      ]);

      const stepChecks = [
        { id: 'building_added', label: 'Erstes Gebäude angelegt', completed: buildings.length > 0 },
        { id: 'tenant_added', label: 'Erster Mieter hinzugefügt', completed: tenants.length > 0 },
        { id: 'contract_created', label: 'Erster Mietvertrag erstellt', completed: contracts.length > 0 },
        { id: 'invoice_added', label: 'Erste Rechnung erfasst', completed: invoices.length > 0 },
        { id: 'bank_connected', label: 'Bankkonto verbunden', completed: bankAccounts.length > 0 }
      ];

      const completedCount = stepChecks.filter(s => s.completed).length;
      const progressPercent = Math.round((completedCount / stepChecks.length) * 100);

      setSteps(stepChecks);
      setProgress(progressPercent);

      // Hide if 100% complete
      if (progressPercent === 100) {
        setTimeout(() => setShow(false), 3000);
      }
    } catch (error) {
      console.error('Error loading onboarding progress:', error);
    }
  };

  if (!show || progress === 100) return null;

  return (
    <Card className="border border-emerald-200 bg-emerald-50 mb-6">
      <CardContent className="pt-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold text-slate-900">Erste Schritte</h4>
          <span className="text-sm font-medium text-emerald-700">{progress}%</span>
        </div>
        <Progress value={progress} className="mb-4" />
        <div className="space-y-2">
          {steps.map((step) => (
            <div key={step.id} className="flex items-center gap-2 text-sm">
              {step.completed ? (
                <CheckCircle className="w-4 h-4 text-emerald-600" />
              ) : (
                <Circle className="w-4 h-4 text-slate-400" />
              )}
              <span className={step.completed ? 'text-slate-900 font-medium' : 'text-slate-600'}>
                {step.label}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}