import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from 'lucide-react';
import Step1BuildingSelection from './Step1BuildingSelection';
import Step2ContractSelection from './Step2ContractSelection';
import Step3CostSelection from './Step3CostSelection';
import Step4DirectCosts from './Step4DirectCosts';
import Step5Summary from './Step5Summary';

export default function OperatingCostStatementDialog({ open, onOpenChange, onSuccess }) {
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
        results: []
    });

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

    const renderStep = () => {
        switch (currentStep) {
            case 1:
                return <Step1BuildingSelection data={statementData} onNext={handleNext} onDataChange={handleStepData} />;
            case 2:
                return <Step2ContractSelection data={statementData} onNext={handleNext} onBack={handleBack} onDataChange={handleStepData} />;
            case 3:
                return <Step3CostSelection data={statementData} onNext={handleNext} onBack={handleBack} onDataChange={handleStepData} />;
            case 4:
                return <Step4DirectCosts data={statementData} onNext={handleNext} onBack={handleBack} onDataChange={handleStepData} />;
            case 5:
                return <Step5Summary data={statementData} onBack={handleBack} onSuccess={onSuccess} onClose={() => onOpenChange(false)} />;
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
                        <React.Fragment key={step.number}>
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
                        </React.Fragment>
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