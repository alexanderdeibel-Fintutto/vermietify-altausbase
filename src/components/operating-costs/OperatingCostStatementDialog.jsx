import React, { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import Step1BuildingSelection from './Step1BuildingSelection';
import Step2ContractSelection from './Step2ContractSelection';
import Step3CostSelection from './Step3CostSelection';
import Step4DirectCosts from './Step4DirectCosts';
import Step5Summary from './Step5Summary';

export default function OperatingCostStatementDialog({ open, onOpenChange, onSuccess, existingStatement }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [statementData, setStatementData] = useState({
        building_id: '',
        period_start: '',
        period_end: '',
        selected_units: [],
        contracts: [],
        vacancies: [],
        costs: {},
        directCosts: {},
        manualCosts: [],
        results: []
    });
    const [statementId, setStatementId] = useState(null);
    const queryClient = useQueryClient();

    useEffect(() => {
        if (existingStatement && open) {
            setStatementId(existingStatement.id);
            setCurrentStep(existingStatement.current_step || 1);
            if (existingStatement.draft_details) {
                setStatementData(existingStatement.draft_details);
            } else {
                setStatementData({
                    building_id: existingStatement.building_id || '',
                    period_start: existingStatement.period_start || '',
                    period_end: existingStatement.period_end || '',
                    selected_units: existingStatement.selected_units || [],
                    contracts: [],
                    vacancies: [],
                    costs: {},
                    directCosts: {},
                    manualCosts: [],
                    results: []
                });
            }
        } else if (!existingStatement && !open) {
            setStatementId(null);
            setCurrentStep(1);
            setStatementData({
                building_id: '',
                period_start: '',
                period_end: '',
                selected_units: [],
                contracts: [],
                vacancies: [],
                costs: {},
                directCosts: {},
                manualCosts: [],
                results: []
            });
        }
    }, [existingStatement, open]);

    const steps = [
        { number: 1, title: 'Gebäude & Zeitraum' },
        { number: 2, title: 'Mietverträge' },
        { number: 3, title: 'Kosten' },
        { number: 4, title: 'Direkte Kosten' },
        { number: 5, title: 'Zusammenfassung' }
    ];

    const handleNext = () => {
        if (currentStep < 5) {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleStepData = (data) => {
        setStatementData({ ...statementData, ...data });
    };

    const saveDraftMutation = useMutation({
        mutationFn: async () => {
            const draftData = {
                building_id: statementData.building_id,
                period_start: statementData.period_start,
                period_end: statementData.period_end,
                selected_units: statementData.selected_units,
                status: 'draft',
                current_step: currentStep,
                draft_details: statementData
            };

            if (statementId) {
                return base44.entities.OperatingCostStatement.update(statementId, draftData);
            } else {
                const created = await base44.entities.OperatingCostStatement.create(draftData);
                setStatementId(created.id);
                return created;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['operating-cost-statements'] });
            toast.success('Entwurf gespeichert');
            onOpenChange(false);
        },
        onError: (error) => {
            toast.error('Fehler beim Speichern: ' + error.message);
        }
    });

    const handleSaveDraft = () => {
        if (!statementData.building_id || !statementData.period_start || !statementData.period_end) {
            toast.error('Bitte wählen Sie zuerst ein Gebäude und einen Zeitraum aus');
            return;
        }
        saveDraftMutation.mutate();
    };

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1BuildingSelection data={statementData} onNext={handleNext} onDataChange={handleStepData} onSaveDraft={handleSaveDraft} isSaving={saveDraftMutation.isPending} />;
            case 2:
                return <Step2ContractSelection data={statementData} onNext={handleNext} onBack={handleBack} onDataChange={handleStepData} onSaveDraft={handleSaveDraft} isSaving={saveDraftMutation.isPending} />;
            case 3:
                return <Step3CostSelection data={statementData} onNext={handleNext} onBack={handleBack} onDataChange={handleStepData} onSaveDraft={handleSaveDraft} isSaving={saveDraftMutation.isPending} />;
            case 4:
                return <Step4DirectCosts data={statementData} onNext={handleNext} onBack={handleBack} onDataChange={handleStepData} onSaveDraft={handleSaveDraft} isSaving={saveDraftMutation.isPending} />;
            case 5:
                return <Step5Summary data={statementData} onBack={handleBack} onSuccess={onSuccess} onClose={() => onOpenChange(false)} statementId={statementId} />;
            default:
                return null;
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
                <DialogHeader>
                    <DialogTitle className="text-xl">
                        Betriebskostenabrechnung erstellen
                    </DialogTitle>
                </DialogHeader>

                {/* Progress Steps */}
                <div className="flex items-center justify-between px-4 py-4 border-b border-slate-200">
                    {steps.map((step, index) => (
                        <div key={step.number} className="flex items-center flex-1">
                            <div className="flex items-center gap-3">
                                <div className={`
                                    w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium
                                    ${currentStep === step.number ? 'bg-emerald-600 text-white' : 
                                      currentStep > step.number ? 'bg-emerald-100 text-emerald-700' : 
                                      'bg-slate-100 text-slate-400'}
                                `}>
                                    {step.number}
                                </div>
                                <span className={`text-sm font-medium ${currentStep === step.number ? 'text-slate-800' : 'text-slate-500'}`}>
                                    {step.title}
                                </span>
                            </div>
                            {index < steps.length - 1 && (
                                <div className={`flex-1 h-0.5 mx-4 ${currentStep > step.number ? 'bg-emerald-600' : 'bg-slate-200'}`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {renderStep()}
                </div>
            </DialogContent>
        </Dialog>
    );
}