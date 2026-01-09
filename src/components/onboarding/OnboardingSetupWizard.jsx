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
    title: 'Miettyp',
    description: 'Wählen Sie Ihren Miettyp aus',
    fields: ['tenant_type']
  },
  {
    title: 'Gebäudeinformationen',
    description: 'Geben Sie Informationen zu Ihrem Gebäude ein',
    fields: ['building_id', 'building_name', 'building_address']
  },
  {
    title: 'Einheitdetails',
    description: 'Informationen zu Ihrer Einheit',
    fields: ['unit_id', 'unit_number', 'unit_type']
  },
  {
    title: 'Mietvereinbarung',
    description: 'Mietvereinbarungsdetails',
    fields: ['rent_amount', 'start_date', 'end_date']
  },
  {
    title: 'Primärer Kontakt',
    description: 'Primäre Kontaktinformation',
    fields: ['primary_contact_phone', 'emergency_contact']
  }
];

export default function OnboardingSetupWizard({ tenantData, onTenantTypeChange, onComplete, isLoading }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [formData, setFormData] = useState({
    tenant_type: '',
    building_id: '',
    building_name: '',
    building_address: '',
    unit_id: '',
    unit_number: '',
    unit_type: 'apartment',
    rent_amount: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    primary_contact_phone: tenantData?.phone || '',
    emergency_contact: ''
  });

  const currentStep = STEPS[currentStepIndex];
  const isLastStep = currentStepIndex === STEPS.length - 1;
  const isFirstStep = currentStepIndex === 0;

  const handleInputChange = (field, value) => {
    const newData = { ...formData, [field]: value };
    setFormData(newData);
    if (field === 'tenant_type') {
      onTenantTypeChange(value);
    }
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
        {/* Step 1: Tenant Type */}
        {currentStepIndex === 0 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {['residential', 'commercial', 'student'].map(type => (
                <button
                  key={type}
                  onClick={() => handleInputChange('tenant_type', type)}
                  className={`p-4 border-2 rounded-lg transition-all ${
                    formData.tenant_type === type
                      ? 'border-slate-700 bg-slate-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <p className="font-semibold text-slate-900">
                    {type === 'residential' ? 'Wohnmiete' : type === 'commercial' ? 'Gewerbe' : 'Student'}
                  </p>
                  <p className="text-sm text-slate-600 mt-1">
                    {type === 'residential' && 'Für Wohnzwecke'}
                    {type === 'commercial' && 'Für geschäftliche Zwecke'}
                    {type === 'student' && 'Für studentisches Wohnen'}
                  </p>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Building */}
        {currentStepIndex === 1 && (
          <div className="space-y-4">
            <Input
              placeholder="Gebäude-ID"
              value={formData.building_id}
              onChange={(e) => handleInputChange('building_id', e.target.value)}
            />
            <Input
              placeholder="Gebäudename"
              value={formData.building_name}
              onChange={(e) => handleInputChange('building_name', e.target.value)}
            />
            <Input
              placeholder="Gebäudeadresse"
              value={formData.building_address}
              onChange={(e) => handleInputChange('building_address', e.target.value)}
            />
          </div>
        )}

        {/* Step 3: Unit */}
        {currentStepIndex === 2 && (
          <div className="space-y-4">
            <Input
              placeholder="Einheit-ID"
              value={formData.unit_id}
              onChange={(e) => handleInputChange('unit_id', e.target.value)}
            />
            <Input
              placeholder="Einheitsnummer"
              value={formData.unit_number}
              onChange={(e) => handleInputChange('unit_number', e.target.value)}
            />
            <Select value={formData.unit_type} onValueChange={(val) => handleInputChange('unit_type', val)}>
              <SelectTrigger>
                <SelectValue placeholder="Einheitstyp" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Wohnung</SelectItem>
                <SelectItem value="house">Haus</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="office">Büro</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Step 4: Lease */}
        {currentStepIndex === 3 && (
          <div className="space-y-4">
            <Input
              type="number"
              placeholder="Monatliche Miete (€)"
              value={formData.rent_amount}
              onChange={(e) => handleInputChange('rent_amount', e.target.value)}
            />
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => handleInputChange('start_date', e.target.value)}
            />
            <Input
              type="date"
              value={formData.end_date}
              onChange={(e) => handleInputChange('end_date', e.target.value)}
            />
          </div>
        )}

        {/* Step 5: Contact */}
        {currentStepIndex === 4 && (
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="Primäre Kontaktnummer"
              value={formData.primary_contact_phone}
              onChange={(e) => handleInputChange('primary_contact_phone', e.target.value)}
            />
            <Input
              placeholder="Notfallkontakt"
              value={formData.emergency_contact}
              onChange={(e) => handleInputChange('emergency_contact', e.target.value)}
            />
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