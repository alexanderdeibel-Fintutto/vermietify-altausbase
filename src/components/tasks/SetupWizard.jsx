import React, { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2, Sparkles, Mail, Zap, ArrowRight, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';

export default function SetupWizard({ open, onComplete }) {
    const [currentStep, setCurrentStep] = useState(1);
    const [completedSteps, setCompletedSteps] = useState([]);
    const queryClient = useQueryClient();

    const initializeMutation = useMutation({
        mutationFn: async ({ step, action }) => {
            const response = await base44.functions.invoke('initializeTaskSystem', { step, action });
            return response.data;
        },
        onSuccess: (data, variables) => {
            toast.success(data.message);
            setCompletedSteps([...completedSteps, variables.step]);
            queryClient.invalidateQueries();
        },
        onError: (error) => {
            toast.error('Fehler: ' + error.message);
        }
    });

    const steps = [
        {
            step: 1,
            title: "Willkommen im Task-Management",
            icon: Sparkles,
            description: "Einrichtung der grundlegenden Einstellungen für Ihr Task-System",
            content: (
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Wir importieren Standard-Workflows und Prioritäten, damit Sie sofort loslegen können.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            4 Standard-Prioritäten (Niedrig, Normal, Hoch, Dringend)
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            4 vorkonfigurierte Workflows (Mieterwechsel, Mängel, etc.)
                        </li>
                    </ul>
                </div>
            ),
            actions: [
                {
                    label: "Standard-Workflows importieren",
                    action: "import",
                    primary: true
                },
                {
                    label: "Überspringen",
                    action: "skip",
                    primary: false
                }
            ]
        },
        {
            step: 2,
            title: "Email-Integration",
            icon: Mail,
            description: "IMAP-Konten für automatische Task-Erstellung einrichten",
            content: (
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Verbinden Sie Ihre Email-Konten, um automatisch Tasks aus eingehenden Emails zu erstellen.
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-900">
                            Sie können dies auch später im Tab "Emails" einrichten.
                        </p>
                    </div>
                </div>
            ),
            actions: [
                {
                    label: "Später einrichten",
                    action: "skip",
                    primary: true
                }
            ]
        },
        {
            step: 3,
            title: "Automatisierungen",
            icon: Zap,
            description: "Grundlegende Automatisierungen aktivieren",
            content: (
                <div className="space-y-4">
                    <p className="text-slate-600">
                        Aktivieren Sie intelligente Automatisierungen für wiederkehrende Aufgaben.
                    </p>
                    <ul className="space-y-2 text-sm text-slate-600">
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Tägliche Erinnerungen für fällige Tasks
                        </li>
                        <li className="flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-green-600" />
                            Automatische Task-Erstellung bei Vertragsabschluss
                        </li>
                    </ul>
                </div>
            ),
            actions: [
                {
                    label: "Standard-Automatisierungen aktivieren",
                    action: "activate",
                    primary: true
                },
                {
                    label: "Manuell konfigurieren",
                    action: "skip",
                    primary: false
                }
            ]
        }
    ];

    const currentStepData = steps.find(s => s.step === currentStep);
    const StepIcon = currentStepData?.icon;
    const isLastStep = currentStep === steps.length;

    const handleAction = async (action) => {
        if (action === 'skip') {
            handleNext();
            return;
        }

        await initializeMutation.mutateAsync({ step: currentStep, action });
        handleNext();
    };

    const handleNext = () => {
        if (isLastStep) {
            onComplete();
        } else {
            setCurrentStep(currentStep + 1);
        }
    };

    const handleBack = () => {
        if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
        }
    };

    return (
        <Dialog open={open} onOpenChange={() => {}}>
            <DialogContent className="sm:max-w-2xl" hideClose>
                <DialogHeader>
                    <div className="flex items-center gap-3 mb-2">
                        {StepIcon && <StepIcon className="w-8 h-8 text-emerald-600" />}
                        <div>
                            <DialogTitle className="text-2xl">
                                {currentStepData?.title}
                            </DialogTitle>
                            <p className="text-sm text-slate-500 mt-1">
                                Schritt {currentStep} von {steps.length}
                            </p>
                        </div>
                    </div>
                </DialogHeader>

                {/* Progress Bar */}
                <div className="flex gap-2 mb-6">
                    {steps.map((step) => (
                        <div
                            key={step.step}
                            className={`h-2 flex-1 rounded-full transition-colors ${
                                step.step <= currentStep
                                    ? 'bg-emerald-600'
                                    : 'bg-slate-200'
                            }`}
                        />
                    ))}
                </div>

                {/* Content */}
                <Card className="border-slate-200">
                    <CardContent className="p-6">
                        <p className="text-lg font-medium text-slate-800 mb-4">
                            {currentStepData?.description}
                        </p>
                        {currentStepData?.content}
                    </CardContent>
                </Card>

                {/* Actions */}
                <div className="flex items-center justify-between mt-6">
                    <Button
                        variant="outline"
                        onClick={handleBack}
                        disabled={currentStep === 1}
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Zurück
                    </Button>

                    <div className="flex gap-3">
                        {currentStepData?.actions.map((actionItem, idx) => (
                            <Button
                                key={idx}
                                onClick={() => handleAction(actionItem.action)}
                                disabled={initializeMutation.isPending}
                                variant={actionItem.primary ? "default" : "outline"}
                                className={actionItem.primary ? "bg-emerald-600 hover:bg-emerald-700" : ""}
                            >
                                {actionItem.label}
                                {actionItem.primary && !isLastStep && (
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                )}
                            </Button>
                        ))}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}