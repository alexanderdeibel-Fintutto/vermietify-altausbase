import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, Circle } from 'lucide-react';

export default function TenantOnboardingChecklist({ tenantId }) {
  const queryClient = useQueryClient();

  const { data: session } = useQuery({
    queryKey: ['tenant-session', tenantId],
    queryFn: async () => {
      const sessions = await base44.entities.TenantAppSession.filter({ tenant_id: tenantId });
      return sessions[0];
    }
  });

  const updateProgressMutation = useMutation({
    mutationFn: (step) =>
      base44.entities.TenantAppSession.update(session.id, {
        onboarding_progress: {
          ...session.onboarding_progress,
          [step]: true
        }
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tenant-session'] })
  });

  const steps = [
    { key: 'profile_setup', label: 'Profil vervollständigen', desc: 'Name, Kontaktdaten' },
    { key: 'document_review', label: 'Vertragsdokumente ansehen', desc: 'Mietvertrag, Übergabeprotokoll' },
    { key: 'payment_setup', label: 'Zahlungsmethode einrichten', desc: 'SEPA-Mandat' },
    { key: 'house_rules_read', label: 'Hausordnung lesen', desc: 'Wichtige Regeln' },
    { key: 'emergency_contacts_saved', label: 'Notfallkontakte speichern', desc: 'Hausmeister, Verwaltung' }
  ];

  const progress = session?.onboarding_progress || {};
  const completedSteps = Object.values(progress).filter(Boolean).length;
  const progressPercent = (completedSteps / steps.length) * 100;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Willkommen! 🏠</CardTitle>
        <Progress value={progressPercent} className="mt-2" />
        <p className="text-xs text-slate-600 mt-2">{completedSteps} von {steps.length} abgeschlossen</p>
      </CardHeader>
      <CardContent className="space-y-2">
        {steps.map(step => (
          <div key={step.key} className="flex items-start gap-3 p-3 border rounded">
            <div className="mt-0.5">
              {progress[step.key] ? 
                <CheckCircle className="w-5 h-5 text-green-600" /> :
                <Circle className="w-5 h-5 text-slate-400" />
              }
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium">{step.label}</p>
              <p className="text-xs text-slate-600">{step.desc}</p>
            </div>
            {!progress[step.key] && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => updateProgressMutation.mutate(step.key)}
              >
                Erledigt
              </Button>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}