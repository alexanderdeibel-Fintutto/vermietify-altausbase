import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { X, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import { toast } from 'sonner';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function IntelligentOnboardingWizardDialog({
  open,
  onOpenChange,
  onboardingState,
  onSkip
}) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!open || !onboardingState) return null;

  const nextStep = onboardingState.next_step;
  const allSteps = onboardingState.all_steps;
  const progress = (onboardingState.completed_steps.length / allSteps.length) * 100;

  const handleStepComplete = async () => {
    setIsSubmitting(true);
    try {
      const stepId = nextStep?.id;

      // Step-specific data saving
      if (stepId === 'add_building' && formData.building_name) {
        await base44.entities.Building.create({
          name: formData.building_name,
          street: formData.building_address,
          zip: formData.building_zip,
          type: 'residential'
        });
      }

      if (stepId === 'add_tenant' && formData.tenant_name) {
        await base44.entities.Tenant.create({
          name: formData.tenant_name,
          email: formData.tenant_email
        });
      }

      // Update onboarding progress
      const onboardingRecords = await base44.entities.UserOnboarding.filter(
        { user_id: onboardingState.user_id },
        null,
        1
      );
      
      if (onboardingRecords[0]) {
        await base44.entities.UserOnboarding.update(
          onboardingRecords[0].id,
          {
            completed_steps: [
              ...(onboardingRecords[0].completed_steps || []),
              stepId
            ],
            onboarding_progress: progress + (100 / allSteps.length),
            current_step: null
          }
        );
      }

      toast.success(`✅ ${nextStep.title} abgeschlossen!`);
      onOpenChange();
    } catch (err) {
      toast.error('Fehler beim Speichern: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderStepContent = () => {
    const stepId = nextStep?.id;

    switch (stepId) {
      case 'welcome':
        return (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
              <h3 className="text-xl font-light text-blue-900 mb-2">🏠 Willkommen!</h3>
              <p className="font-light text-blue-800">
                In den nächsten Minuten richten wir Ihr System ein. Sie können jederzeit zurückkommen und weitermachen!
              </p>
            </div>
          </div>
        );

      case 'add_building':
        return (
          <div className="space-y-4">
            <p className="text-sm font-light text-slate-700 mb-4">
              Ein Objekt ist die Basis für alles. Geben Sie Name und Adresse an:
            </p>
            <Input
              placeholder="Objektname (z.B. 'Villa Musterstrasse')"
              value={formData.building_name || ''}
              onChange={(e) => setFormData({ ...formData, building_name: e.target.value })}
              className="font-light"
            />
            <Input
              placeholder="Straße und Hausnummer"
              value={formData.building_address || ''}
              onChange={(e) => setFormData({ ...formData, building_address: e.target.value })}
              className="font-light"
            />
            <Input
              placeholder="PLZ"
              value={formData.building_zip || ''}
              onChange={(e) => setFormData({ ...formData, building_zip: e.target.value })}
              className="font-light"
            />
            <div className="bg-slate-50 p-3 rounded-lg">
              <p className="text-xs font-light text-slate-600">
                💡 Nach Abschluss können Sie weitere Details auf der <Link to={createPageUrl('Buildings')} className="text-blue-600 hover:underline">Gebäude-Seite</Link> hinzufügen.
              </p>
            </div>
          </div>
        );

      case 'connect_bank':
        return (
          <div className="space-y-4">
            <p className="text-sm font-light text-slate-700 mb-4">
              Verbinden Sie Ihre Bankkonten für automatische Transaktionssynchronisation:
            </p>
            <Card className="p-4 bg-blue-50 border border-blue-200">
              <p className="text-sm font-light text-blue-900 mb-3">
                FinAPI ermöglicht es Ihnen, Bankkonten sicher zu verbinden und Transaktionen automatisch abzurufen.
              </p>
              <Link to={createPageUrl('BankAccounts')}>
                <Button className="w-full bg-blue-600 hover:bg-blue-700 font-light gap-2">
                  🏦 Bankkonto verbinden
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </Link>
            </Card>
            <p className="text-xs font-light text-slate-500">
              Sie werden zu Ihrem Bankkonto-Setup weitergeleitet. Danach können Sie hier fortfahren.
            </p>
          </div>
        );

      case 'add_tenant':
        return (
          <div className="space-y-4">
            <p className="text-sm font-light text-slate-700 mb-4">
              Fügen Sie Ihre ersten Mieter hinzu:
            </p>
            <Input
              placeholder="Mieter-Name"
              value={formData.tenant_name || ''}
              onChange={(e) => setFormData({ ...formData, tenant_name: e.target.value })}
              className="font-light"
            />
            <Input
              placeholder="E-Mail-Adresse"
              type="email"
              value={formData.tenant_email || ''}
              onChange={(e) => setFormData({ ...formData, tenant_email: e.target.value })}
              className="font-light"
            />
            <Link to={createPageUrl('Tenants')}>
              <Button variant="outline" className="w-full font-light gap-2">
                👥 Zu Mieter-Verwaltung
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        );

      case 'setup_elster':
        return (
          <div className="space-y-4">
            <p className="text-sm font-light text-slate-700 mb-4">
              Konfigurieren Sie die ELSTER-Steuererklärung:
            </p>
            <Card className="p-4 bg-purple-50 border border-purple-200">
              <p className="text-sm font-light text-purple-900">
                Speichern Sie Zeit bei der Steuererklärung mit automatischer Daten-Integration.
              </p>
            </Card>
            <Link to={createPageUrl('ElsterIntegration')}>
              <Button className="w-full bg-purple-600 hover:bg-purple-700 font-light gap-2">
                📋 ELSTER konfigurieren
                <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        );

      default:
        return <p className="text-sm font-light text-slate-700">Unbekannter Schritt</p>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-between mb-4">
            <Badge className="bg-blue-100 text-blue-800 font-light">
              Schritt {onboardingState.completed_steps.length + 1}/{allSteps.length}
            </Badge>
            <button
              onClick={() => onOpenChange()}
              className="text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <DialogTitle className="text-xl font-light">{nextStep?.title}</DialogTitle>
          <DialogDescription className="font-light text-slate-600">
            {nextStep?.description}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <Progress value={progress} className="h-2 mb-6" />

        {/* Step Content */}
        <div className="py-4">
          {renderStepContent()}
        </div>

        {/* Completed Steps */}
        <div className="space-y-2 mb-6">
          <p className="text-xs font-light text-slate-600 uppercase tracking-wide">Abgeschlossen</p>
          {allSteps
            .filter(s => onboardingState.completed_steps.includes(s.id))
            .map(step => (
              <div key={step.id} className="flex items-center gap-2 text-sm font-light text-slate-700">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                {step.title}
              </div>
            ))}
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={onSkip}
            className="flex-1 font-light text-slate-600"
          >
            Später
          </Button>
          <Button
            onClick={handleStepComplete}
            disabled={isSubmitting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 font-light gap-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Speichert...
              </>
            ) : (
              <>
                Verstanden
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}