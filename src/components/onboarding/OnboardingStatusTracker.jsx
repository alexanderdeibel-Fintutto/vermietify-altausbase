import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Clock, FileText, Send, Key, CheckSquare } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';

const STATUS_STEPS = [
  { key: 'initiated', label: 'Gestartet', icon: Circle },
  { key: 'documents_generated', label: 'Dokumente erstellt', icon: FileText },
  { key: 'documents_sent', label: 'Dokumente versendet', icon: Send },
  { key: 'documents_signed', label: 'Dokumente unterschrieben', icon: CheckSquare },
  { key: 'keys_handed', label: 'Schlüssel übergeben', icon: Key },
  { key: 'completed', label: 'Abgeschlossen', icon: CheckCircle2 }
];

export default function OnboardingStatusTracker({ onboardingId }) {
  const { data: onboarding } = useQuery({
    queryKey: ['onboarding', onboardingId],
    queryFn: () => base44.entities.TenantOnboarding.get(onboardingId),
    enabled: !!onboardingId
  });

  if (!onboarding) return null;

  const currentStepIndex = STATUS_STEPS.findIndex(s => s.key === onboarding.status);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Onboarding-Status</CardTitle>
          <Badge>{onboarding.progress_percentage}%</Badge>
        </div>
        <Progress value={onboarding.progress_percentage} className="mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {STATUS_STEPS.map((step, idx) => {
            const Icon = step.icon;
            const isCompleted = idx <= currentStepIndex;
            const isCurrent = idx === currentStepIndex;
            const completedStep = onboarding.steps_completed?.find(s => s.step === step.key);

            return (
              <div key={step.key} className="flex items-start gap-3">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  isCompleted ? 'bg-green-100' :
                  isCurrent ? 'bg-blue-100' :
                  'bg-slate-100'
                }`}>
                  <Icon className={`w-4 h-4 ${
                    isCompleted ? 'text-green-600' :
                    isCurrent ? 'text-blue-600' :
                    'text-slate-400'
                  }`} />
                </div>
                <div className="flex-1">
                  <p className={`font-semibold text-sm ${isCompleted ? 'text-slate-900' : 'text-slate-500'}`}>
                    {step.label}
                  </p>
                  {completedStep && (
                    <p className="text-xs text-slate-500">
                      {new Date(completedStep.completed_at).toLocaleString('de-DE')}
                    </p>
                  )}
                </div>
                {isCompleted && <CheckCircle2 className="w-4 h-4 text-green-600" />}
              </div>
            );
          })}
        </div>

        {/* Documents */}
        {onboarding.generated_documents?.length > 0 && (
          <div className="mt-6 pt-6 border-t">
            <h4 className="font-semibold text-sm mb-3">Dokumente</h4>
            <div className="space-y-2">
              {onboarding.generated_documents.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-600" />
                    <span className="text-sm">
                      {doc.document_type === 'lease_contract' && 'Mietvertrag'}
                      {doc.document_type === 'handover_protocol' && 'Übergabeprotokoll'}
                    </span>
                  </div>
                  <Badge variant={doc.status === 'sent' ? 'default' : 'secondary'}>
                    {doc.status}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}