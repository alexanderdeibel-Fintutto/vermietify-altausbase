import React, { useState } from 'react';
import { VfWizard } from '@/components/workflows/VfWizard';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CheckCircle } from 'lucide-react';

export default function WizardExample() {
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState({
    companyName: '',
    address: '',
    contact: '',
    description: ''
  });

  const steps = [
    {
      label: "Firmendaten",
      title: "Grundlegende Informationen",
      description: "Geben Sie die Basisdaten Ihres Unternehmens ein"
    },
    {
      label: "Kontakt",
      title: "Kontaktinformationen",
      description: "Wie können wir Sie erreichen?"
    },
    {
      label: "Details",
      title: "Weitere Details",
      description: "Erzählen Sie uns mehr über Ihr Unternehmen"
    },
    {
      label: "Abschluss",
      title: "Fertig!",
      description: "Überprüfen Sie Ihre Angaben"
    }
  ];

  return (
    <div className="max-w-4xl mx-auto py-12">
      <VfWizard
        steps={steps}
        currentStep={currentStep}
        onStepChange={setCurrentStep}
      >
        {currentStep === 0 && (
          <div className="space-y-4">
            <div>
              <Label required>Firmenname</Label>
              <Input
                value={formData.companyName}
                onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                placeholder="Muster GmbH"
              />
            </div>
            <div>
              <Label>Adresse</Label>
              <Input
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Musterstraße 123, 12345 Musterstadt"
              />
            </div>
          </div>
        )}

        {currentStep === 1 && (
          <div className="space-y-4">
            <div>
              <Label required>E-Mail</Label>
              <Input
                type="email"
                value={formData.contact}
                onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                placeholder="kontakt@beispiel.de"
              />
            </div>
          </div>
        )}

        {currentStep === 2 && (
          <div className="space-y-4">
            <div>
              <Label>Beschreibung</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Beschreiben Sie Ihr Unternehmen..."
              />
            </div>
          </div>
        )}

        {currentStep === 3 && (
          <div className="text-center py-8">
            <CheckCircle className="h-16 w-16 mx-auto mb-4 text-[var(--vf-success-500)]" />
            <h3 className="text-xl font-semibold mb-2">Erfolgreich abgeschlossen!</h3>
            <p className="text-[var(--theme-text-secondary)] mb-6">
              Ihre Daten wurden gespeichert.
            </p>
            <Button variant="gradient">Zum Dashboard</Button>
          </div>
        )}
      </VfWizard>
    </div>
  );
}