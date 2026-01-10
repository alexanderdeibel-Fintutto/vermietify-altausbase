import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { 
  BookOpen, MessageCircle, Upload, Wrench, 
  CheckCircle, ArrowRight, Bell, Mail, Smartphone 
} from 'lucide-react';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

const steps = [
  {
    id: 'welcome',
    title: 'Willkommen im Mieterportal',
    description: 'Wir freuen uns, Sie bei uns zu haben! Lassen Sie uns Ihnen kurz die wichtigsten Funktionen zeigen.',
    icon: CheckCircle,
    color: 'blue'
  },
  {
    id: 'knowledge',
    title: 'Wissensdatenbank',
    description: 'Finden Sie schnell Antworten auf häufig gestellte Fragen zu Ihrem Mietverhältnis, Zahlungen und mehr.',
    icon: BookOpen,
    color: 'purple'
  },
  {
    id: 'communication',
    title: 'Kommunikations-Hub',
    description: 'Kontaktieren Sie Ihren Vermieter direkt über das Portal. Alle Nachrichten werden sicher gespeichert.',
    icon: MessageCircle,
    color: 'green'
  },
  {
    id: 'documents',
    title: 'Dokumente hochladen',
    description: 'Laden Sie wichtige Dokumente wie Versicherungsnachweise oder Auszugsprotokolle bequem hoch.',
    icon: Upload,
    color: 'orange'
  },
  {
    id: 'maintenance',
    title: 'Störungen melden',
    description: 'Melden Sie Probleme oder Wartungsbedarf direkt und verfolgen Sie den Bearbeitungsstatus.',
    icon: Wrench,
    color: 'red'
  },
  {
    id: 'preferences',
    title: 'Benachrichtigungen',
    description: 'Wählen Sie, wie Sie über Neuigkeiten informiert werden möchten.',
    icon: Bell,
    color: 'indigo',
    isPreferences: true
  }
];

export default function TenantOnboardingFlow({ open, onComplete }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [preferences, setPreferences] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true
  });

  const queryClient = useQueryClient();

  const completeMutation = useMutation({
    mutationFn: async () => {
      await base44.auth.updateMe({
        tenant_onboarding_completed: true,
        notification_preferences: preferences
      });
    },
    onSuccess: () => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      });
      queryClient.invalidateQueries(['currentUser']);
      toast.success('Willkommen! Sie können jetzt alle Funktionen nutzen.');
      setTimeout(() => {
        onComplete();
      }, 1500);
    }
  });

  const step = steps[currentStep];
  const isLastStep = currentStep === steps.length - 1;

  const handleNext = () => {
    if (isLastStep) {
      completeMutation.mutate();
    } else {
      setCurrentStep(currentStep + 1);
    }
  };

  const colorClasses = {
    blue: 'bg-blue-600',
    purple: 'bg-purple-600',
    green: 'bg-green-600',
    orange: 'bg-orange-600',
    red: 'bg-red-600',
    indigo: 'bg-indigo-600'
  };

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="max-w-2xl" onInteractOutside={(e) => e.preventDefault()}>
        <div className="space-y-6 py-4">
          {/* Progress */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex gap-2">
              {steps.map((_, idx) => (
                <div 
                  key={idx}
                  className={`h-2 w-12 rounded-full transition-colors ${
                    idx <= currentStep ? 'bg-blue-600' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
            <span className="text-sm text-slate-600">
              Schritt {currentStep + 1} von {steps.length}
            </span>
          </div>

          {/* Content */}
          <div className="text-center">
            <div className={`w-20 h-20 ${colorClasses[step.color]} rounded-full flex items-center justify-center mx-auto mb-6`}>
              <step.icon className="w-10 h-10 text-white" />
            </div>

            <h2 className="text-2xl font-bold mb-4">{step.title}</h2>
            <p className="text-slate-600 text-lg mb-8">{step.description}</p>

            {/* Preferences Form */}
            {step.isPreferences && (
              <Card className="max-w-md mx-auto">
                <CardContent className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Mail className="w-5 h-5 text-blue-600" />
                      <Label htmlFor="email">E-Mail Benachrichtigungen</Label>
                    </div>
                    <Switch
                      id="email"
                      checked={preferences.email_notifications}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, email_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-green-600" />
                      <Label htmlFor="sms">SMS Benachrichtigungen</Label>
                    </div>
                    <Switch
                      id="sms"
                      checked={preferences.sms_notifications}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, sms_notifications: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-purple-600" />
                      <Label htmlFor="push">Push-Benachrichtigungen</Label>
                    </div>
                    <Switch
                      id="push"
                      checked={preferences.push_notifications}
                      onCheckedChange={(checked) => 
                        setPreferences({ ...preferences, push_notifications: checked })
                      }
                    />
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center pt-6 border-t">
            {currentStep > 0 ? (
              <Button
                variant="outline"
                onClick={() => setCurrentStep(currentStep - 1)}
              >
                Zurück
              </Button>
            ) : (
              <div />
            )}

            <Button
              onClick={handleNext}
              disabled={completeMutation.isPending}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {completeMutation.isPending ? (
                'Wird gespeichert...'
              ) : isLastStep ? (
                <>
                  Los geht's!
                  <CheckCircle className="w-4 h-4 ml-2" />
                </>
              ) : (
                <>
                  Weiter
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}