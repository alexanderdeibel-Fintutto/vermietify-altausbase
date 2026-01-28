import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '../utils';
import { supabase } from '@/components/services/supabaseClient';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Check } from 'lucide-react';
import Step1BuildingSelection from '@/components/operating-costs/Step1BuildingSelection';
import Step2ContractSelection from '@/components/operating-costs/Step2ContractSelection';
import Step3CostSelection from '@/components/operating-costs/Step3CostSelection';
import Step4DirectCosts from '@/components/operating-costs/Step4DirectCosts';
import Step5Summary from '@/components/operating-costs/Step5Summary';

export default function OperatingCostWizard() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('id');
  const queryClient = useQueryClient();

  // Draft laden falls vorhanden
  const { data: draft } = useQuery({
    queryKey: ['operatingCostDraft', draftId],
    queryFn: async () => {
      if (!draftId) return null;
      const { data, error } = await supabase
        .from('v_operating_cost_summary')
        .select('*')
        .eq('id', draftId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!draftId
  });

  const initialData = draft?.draft_details ? JSON.parse(draft.draft_details) : {};

  const [currentStep, setCurrentStep] = useState(draft?.current_step || 0);
  const [formData, setFormData] = useState({
    building_id: initialData.building_id || '',
    period_start: initialData.period_start || `${new Date().getFullYear() - 1}-01-01`,
    period_end: initialData.period_end || `${new Date().getFullYear() - 1}-12-31`,
    selected_units: initialData.selected_units || [],
    contracts: initialData.contracts || [],
    vacancies: initialData.vacancies || [],
    costs: initialData.costs || {},
    directCosts: initialData.directCosts || {},
    manualCosts: initialData.manualCosts || []
  });

  const steps = [
    { id: 'building', label: 'Objekt & Einheiten' },
    { id: 'contracts', label: 'Verträge & Leerstände' },
    { id: 'costs', label: 'Kosten erfassen' },
    { id: 'directCosts', label: 'Direkte Zuordnung' },
    { id: 'summary', label: 'Zusammenfassung' }
  ];

  // Draft speichern
  const saveDraftMutation = useMutation({
    mutationFn: async (data) => {
      if (draftId) {
        const { data: result, error } = await supabase
          .from('OperatingCostStatement')
          .update({
            draft_details: JSON.stringify(data),
            current_step: currentStep,
            status: 'Entwurf',
            updated_date: new Date().toISOString()
          })
          .eq('id', draftId)
          .select()
          .single();
        if (error) throw error;
        return result;
      } else {
        const { data: result, error } = await supabase
          .from('OperatingCostStatement')
          .insert([{
            building_id: data.building_id,
            abrechnungsjahr: new Date(data.period_start).getFullYear(),
            zeitraum_von: data.period_start,
            zeitraum_bis: data.period_end,
            erstellungsdatum: new Date().toISOString().split('T')[0],
            status: 'Entwurf',
            draft_details: JSON.stringify(data),
            current_step: currentStep
          }])
          .select()
          .single();
        if (error) throw error;
        return result;
      }
    },
    onSuccess: (data) => {
      toast.success('Entwurf gespeichert');
      queryClient.invalidateQueries({ queryKey: ['operatingCostStatements'] });
      if (!draftId) {
        navigate(createPageUrl('OperatingCostWizard') + `?id=${data.id}`);
      }
    },
    onError: (error) => {
      toast.error('Fehler beim Speichern: ' + error.message);
    }
  });

  const handleDataChange = (stepData) => {
    setFormData(prev => ({ ...prev, ...stepData }));
  };

  const handleNext = () => setCurrentStep(prev => prev + 1);
  const handleBack = () => setCurrentStep(prev => prev - 1);

  const handleSaveDraft = () => {
    saveDraftMutation.mutate(formData);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-5xl mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={() => navigate(createPageUrl('Dashboard'))}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Button>
          <h1 className="text-3xl font-bold">Nebenkostenabrechnung erstellen</h1>
        </div>

        {/* Progress Stepper */}
        <Card className="mb-8">
          <div className="p-6">
            <div className="flex items-center justify-between relative">
              {/* Progress Line */}
              <div className="absolute top-5 left-0 right-0 h-0.5 bg-gray-200 -z-10">
                <div 
                  className="h-full bg-blue-900 transition-all duration-300"
                  style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
                />
              </div>

              {steps.map((step, idx) => (
                <div key={step.id} className="flex flex-col items-center">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 bg-white transition-colors ${
                    idx < currentStep ? 'border-blue-900 bg-blue-900' :
                    idx === currentStep ? 'border-blue-900' :
                    'border-gray-300'
                  }`}>
                    {idx < currentStep ? (
                      <Check className="w-5 h-5 text-white" />
                    ) : (
                      <span className={idx === currentStep ? 'text-blue-900 font-semibold' : 'text-gray-400'}>
                        {idx + 1}
                      </span>
                    )}
                  </div>
                  <span className={`text-xs mt-2 max-w-[80px] text-center ${
                    idx === currentStep ? 'font-semibold text-gray-900' : 'text-gray-600'
                  }`}>
                    {step.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Step Content */}
        <Card>
          <div className="p-8">
            {currentStep === 0 && (
              <Step1BuildingSelection
                data={formData}
                onNext={handleNext}
                onDataChange={handleDataChange}
                onSaveDraft={handleSaveDraft}
                isSaving={saveDraftMutation.isPending}
              />
            )}
            {currentStep === 1 && (
              <Step2ContractSelection
                data={formData}
                onNext={handleNext}
                onBack={handleBack}
                onDataChange={handleDataChange}
                onSaveDraft={handleSaveDraft}
                isSaving={saveDraftMutation.isPending}
              />
            )}
            {currentStep === 2 && (
              <Step3CostSelection
                data={formData}
                onNext={handleNext}
                onBack={handleBack}
                onDataChange={handleDataChange}
                onSaveDraft={handleSaveDraft}
                isSaving={saveDraftMutation.isPending}
              />
            )}
            {currentStep === 3 && (
              <Step4DirectCosts
                data={formData}
                onNext={handleNext}
                onBack={handleBack}
                onDataChange={handleDataChange}
                onSaveDraft={handleSaveDraft}
                isSaving={saveDraftMutation.isPending}
              />
            )}
            {currentStep === 4 && (
              <Step5Summary
                data={formData}
                onBack={handleBack}
                draftId={draftId}
                onSuccess={() => {
                  toast.success('Abrechnung erfolgreich erstellt!');
                  navigate(createPageUrl('OperatingCosts'));
                }}
              />
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}